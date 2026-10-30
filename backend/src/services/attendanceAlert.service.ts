import { prisma } from "../config/prisma";
import { ROLES } from "../config/roles";
import { addDays, isWeekday, startOfDay } from "../utils/dates";
import { notifyUsers } from "./notification.service";

export const ALERT_TYPE = "ATTENDANCE_ALERT";

const hhmm = (d: Date) => d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });

async function adminUserIds(): Promise<number[]> {
  const admins = await prisma.user.findMany({
    where: { active: true, role: { name: ROLES.ADMIN } },
    select: { id: true },
  });
  return admins.map((a) => a.id);
}

type EmployeeForAlert = {
  user: { id: number } | null;
  manager: { user: { id: number; active: boolean } | null } | null;
};

// Admins + the employee's reporting manager (never the employee themselves).
function recipientsFor(employee: EmployeeForAlert, admins: number[]): number[] {
  const set = new Set<number>(admins);
  const managerUser = employee.manager?.user;
  if (managerUser && managerUser.active) set.add(managerUser.id);
  if (employee.user) set.delete(employee.user.id);
  return [...set];
}

const employeeAlertSelect = {
  id: true,
  employeeCode: true,
  name: true,
  user: { select: { id: true } },
  manager: { select: { user: { select: { id: true, active: true } } } },
} as const;

// Backend Intern 2 can call this right after a Late check-in is saved.
export async function notifyLateCheckIn(employeeId: number, checkIn: Date) {
  const employee = await prisma.employee.findUnique({ where: { id: employeeId }, select: employeeAlertSelect });
  if (!employee) return { count: 0 };
  const recipients = recipientsFor(employee, await adminUserIds());
  return notifyUsers(
    recipients,
    `Late check-in: ${employee.name} (${employee.employeeCode}) at ${hhmm(checkIn)}`,
    ALERT_TYPE
  );
}

// Checks today's attendance and notifies Admins + the reporting manager about
// late and absent employees. Safe to run many times: the same alert is never sent twice in one day.
export async function runAttendanceAlerts(now = new Date()) {
  const today = startOfDay(now);
  const tomorrow = addDays(today, 1);
  const date = today.toISOString().slice(0, 10);

  if (!isWeekday(today)) return { date, skipped: "Weekend, no alerts", late: 0, absent: 0, created: 0 };

  const employees = await prisma.employee.findMany({
    where: { status: { not: "Inactive" } },
    select: employeeAlertSelect,
  });
  const ids = employees.map((e) => e.id);

  const attendance = await prisma.attendance.findMany({
    where: { employeeId: { in: ids }, date: { gte: today, lt: tomorrow } },
    select: { employeeId: true, status: true, checkIn: true },
  });
  const leaves = await prisma.leaveRequest.findMany({
    where: { employeeId: { in: ids }, status: "Approved", startDate: { lt: tomorrow }, endDate: { gte: today } },
    select: { employeeId: true },
  });
  const attendanceByEmployee = new Map(attendance.map((a) => [a.employeeId, a]));
  const onLeave = new Set(leaves.map((l) => l.employeeId));

  const admins = await adminUserIds();
  const already = await prisma.notification.findMany({
    where: { type: ALERT_TYPE, createdAt: { gte: today } },
    select: { userId: true, message: true },
  });
  const sent = new Set(already.map((n) => `${n.userId}|${n.message}`));

  const toCreate: { userId: number; message: string; type: string }[] = [];
  let late = 0;
  let absent = 0;

  for (const e of employees) {
    const record = attendanceByEmployee.get(e.id);
    let message: string | null = null;

    if (record) {
      if (record.status === "Late") {
        late++;
        message = `Late check-in: ${e.name} (${e.employeeCode}) at ${hhmm(record.checkIn)}`;
      }
    } else if (!onLeave.has(e.id)) {
      absent++;
      message = `Absent: ${e.name} (${e.employeeCode}) has not checked in today`;
    }
    if (!message) continue;

    for (const userId of recipientsFor(e, admins)) {
      const key = `${userId}|${message}`;
      if (sent.has(key)) continue;
      sent.add(key);
      toCreate.push({ userId, message, type: ALERT_TYPE });
    }
  }

  if (toCreate.length > 0) await prisma.notification.createMany({ data: toCreate });
  return { date, late, absent, created: toCreate.length };
}
