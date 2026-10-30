import { Prisma } from "@prisma/client";
import { prisma } from "../config/prisma";
import { AuthUser } from "../types/auth";
import { addDays, daysInclusive, isWeekday, startOfDay } from "../utils/dates";
import { HttpError } from "../utils/httpError";
import { visibleEmployeeIds } from "./scope.service";

interface Range { from: Date; to: Date }

function checkRange({ from, to }: Range) {
  if (from > to) throw new HttpError(400, "Invalid range", [{ field: "from", message: "From must be before or equal to To" }]);
  if (daysInclusive(from, to) > 366) throw new HttpError(400, "Range too large", [{ field: "to", message: "Maximum range is 366 days" }]);
}

function employeeScope(ids: number[] | undefined, extra: { employeeId?: number; departmentId?: number }): Prisma.EmployeeWhereInput {
  const where: Prisma.EmployeeWhereInput = { status: { not: "Inactive" } };
  if (ids) where.id = { in: ids };
  if (extra.employeeId) {
    // A manager asking for someone outside the team gets no rows (not an error).
    where.id = ids ? { in: ids.filter((i) => i === extra.employeeId) } : extra.employeeId;
  }
  if (extra.departmentId) where.departmentId = extra.departmentId;
  return where;
}

// ---------- Attendance report (ATT-9) ----------
export async function attendanceReport(
  user: AuthUser,
  range: Range,
  filter: { employeeId?: number; departmentId?: number }
) {
  checkRange(range);
  const ids = await visibleEmployeeIds(user);
  const employees = await prisma.employee.findMany({
    where: employeeScope(ids, filter),
    orderBy: { employeeCode: "asc" },
    select: { id: true, employeeCode: true, name: true, joiningDate: true, department: { select: { name: true } } },
  });
  const empIds = employees.map((e) => e.id);
  const end = addDays(range.to, 1);

  const records = await prisma.attendance.findMany({
    where: { employeeId: { in: empIds }, date: { gte: range.from, lt: end } },
  });
  const leaves = await prisma.leaveRequest.findMany({
    where: { employeeId: { in: empIds }, status: "Approved", startDate: { lt: end }, endDate: { gte: range.from } },
  });

  const today = startOfDay(new Date());
  const lastDay = range.to < today ? range.to : today;

  const rows = employees.map((emp) => {
    const mine = records.filter((r) => r.employeeId === emp.id);
    const attended = new Set(mine.map((r) => startOfDay(r.date).getTime()));
    const myLeaves = leaves.filter((l) => l.employeeId === emp.id);

    let leaveDays = 0;
    let absentDays = 0;
    const first = startOfDay(emp.joiningDate) > range.from ? startOfDay(emp.joiningDate) : range.from;
    for (let d = new Date(first); d <= lastDay; d = addDays(d, 1)) {
      if (!isWeekday(d) || attended.has(d.getTime())) continue;
      const onLeave = myLeaves.some((l) => startOfDay(l.startDate) <= d && startOfDay(l.endDate) >= d);
      if (onLeave) leaveDays++;
      else absentDays++;
    }

    return {
      employeeId: emp.id,
      employeeCode: emp.employeeCode,
      name: emp.name,
      department: emp.department.name,
      presentDays: mine.length,
      lateDays: mine.filter((r) => r.status === "Late").length,
      earlyDepartures: mine.filter((r) => r.status === "Early").length,
      leaveDays,
      absentDays,
      workedHours: round2(mine.reduce((s, r) => s + r.workedMinutes, 0) / 60),
      overtimeHours: round2(mine.reduce((s, r) => s + r.overtimeMinutes, 0) / 60),
    };
  });

  const totals = rows.reduce(
    (t, r) => ({
      presentDays: t.presentDays + r.presentDays,
      lateDays: t.lateDays + r.lateDays,
      leaveDays: t.leaveDays + r.leaveDays,
      absentDays: t.absentDays + r.absentDays,
      overtimeHours: round2(t.overtimeHours + r.overtimeHours),
    }),
    { presentDays: 0, lateDays: 0, leaveDays: 0, absentDays: 0, overtimeHours: 0 }
  );
  return { from: range.from, to: range.to, totals, rows };
}

// ---------- Leave report (LEV-7) ----------
export async function leaveReport(
  user: AuthUser,
  range: Range,
  filter: { employeeId?: number; departmentId?: number; leaveTypeId?: number; status?: string }
) {
  checkRange(range);
  const ids = await visibleEmployeeIds(user);
  const employees = await prisma.employee.findMany({ where: employeeScope(ids, filter), select: { id: true } });
  const requests = await prisma.leaveRequest.findMany({
    where: {
      employeeId: { in: employees.map((e) => e.id) },
      startDate: { lt: addDays(range.to, 1) },
      endDate: { gte: range.from },
      ...(filter.leaveTypeId ? { leaveTypeId: filter.leaveTypeId } : {}),
      ...(filter.status ? { status: filter.status } : {}),
    },
    orderBy: { startDate: "desc" },
    include: {
      employee: { select: { employeeCode: true, name: true, department: { select: { name: true } } } },
      leaveType: { select: { name: true } },
    },
  });

  const rows = requests.map((r) => ({
    id: r.id,
    employeeCode: r.employee.employeeCode,
    employeeName: r.employee.name,
    department: r.employee.department.name,
    leaveType: r.leaveType.name,
    startDate: r.startDate,
    endDate: r.endDate,
    days: daysInclusive(r.startDate, r.endDate),
    status: r.status,
    decidedAt: r.decidedAt,
  }));

  const byStatus: Record<string, number> = {};
  const byType: Record<string, number> = {};
  for (const r of rows) {
    byStatus[r.status] = (byStatus[r.status] || 0) + 1;
    byType[r.leaveType] = (byType[r.leaveType] || 0) + r.days;
  }
  return { from: range.from, to: range.to, summary: { total: rows.length, byStatus, daysByType: byType }, rows };
}

// ---------- Department report (DSH-4) ----------
export async function departmentReport(user: AuthUser) {
  const ids = await visibleEmployeeIds(user);
  const employees = await prisma.employee.findMany({
    where: employeeScope(ids, {}),
    select: { department: { select: { name: true } }, designation: { select: { name: true } } },
  });
  const tally = (names: string[]) => {
    const map: Record<string, number> = {};
    names.forEach((n) => (map[n] = (map[n] || 0) + 1));
    return Object.entries(map).map(([name, employees]) => ({ name, employees })).sort((a, b) => a.name.localeCompare(b.name));
  };
  return {
    totalActiveEmployees: employees.length,
    byDepartment: tally(employees.map((e) => e.department.name)),
    byDesignation: tally(employees.map((e) => e.designation.name)),
  };
}

function round2(n: number) {
  return Math.round(n * 100) / 100;
}
