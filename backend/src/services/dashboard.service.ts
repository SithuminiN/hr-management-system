import { Prisma } from "@prisma/client";
import { prisma } from "../config/prisma";
import { ROLES } from "../config/roles";
import { AuthUser } from "../types/auth";
import { addDays, isWeekday, startOfDay } from "../utils/dates";
import { teamEmployeeIds } from "./scope.service";

export async function getSummary(user: AuthUser) {
  const unreadNotifications = await prisma.notification.count({ where: { userId: user.id, isRead: false } });
  if (user.role === ROLES.EMPLOYEE) return personalSummary(user, unreadNotifications);
  return teamOrCompanySummary(user, unreadNotifications);
}

async function teamOrCompanySummary(user: AuthUser, unreadNotifications: number) {
  const today = startOfDay(new Date());
  const tomorrow = addDays(today, 1);

  const where: Prisma.EmployeeWhereInput = { status: { not: "Inactive" } };
  if (user.role === ROLES.MANAGER) where.id = { in: await teamEmployeeIds(user) };

  const scoped = await prisma.employee.findMany({ where, select: { id: true } });
  const ids = scoped.map((e) => e.id);

  const attendanceToday = await prisma.attendance.findMany({
    where: { employeeId: { in: ids }, date: { gte: today, lt: tomorrow } },
    select: { employeeId: true, status: true },
  });
  const checkedIn = new Set(attendanceToday.map((a) => a.employeeId));
  const lateToday = attendanceToday.filter((a) => a.status === "Late").length;

  const leaveToday = await prisma.leaveRequest.findMany({
    where: { employeeId: { in: ids }, status: "Approved", startDate: { lt: tomorrow }, endDate: { gte: today } },
    select: { employeeId: true },
  });
  const onLeave = new Set(leaveToday.map((l) => l.employeeId));

  // Absent = working day, active employee, no check-in and no approved leave.
  const absentToday = isWeekday(today) ? ids.filter((id) => !checkedIn.has(id) && !onLeave.has(id)).length : 0;

  // Requests this person can decide (never their own).
  const pendingWhere: Prisma.LeaveRequestWhereInput = {
    status: "Pending",
    employeeId: { in: ids },
    ...(user.employeeId ? { NOT: { employeeId: user.employeeId } } : {}),
  };
  const pendingLeaveRequests = await prisma.leaveRequest.count({ where: pendingWhere });
  const pendingList = await prisma.leaveRequest.findMany({
    where: pendingWhere,
    orderBy: { createdAt: "desc" },
    take: 5,
    include: { employee: { select: { name: true, employeeCode: true } }, leaveType: { select: { name: true } } },
  });

  return {
    scope: user.role === ROLES.MANAGER ? "team" : "company",
    activeEmployees: ids.length,
    checkedInToday: checkedIn.size,
    lateToday,
    onLeaveToday: [...onLeave].filter((id) => !checkedIn.has(id)).length,
    absentToday,
    pendingLeaveRequests,
    pendingLeaveList: pendingList.map((r) => ({
      id: r.id,
      employeeName: r.employee.name,
      employeeCode: r.employee.employeeCode,
      leaveType: r.leaveType.name,
      startDate: r.startDate,
      endDate: r.endDate,
    })),
    unreadNotifications,
  };
}

async function personalSummary(user: AuthUser, unreadNotifications: number) {
  if (!user.employeeId) {
    return { scope: "personal", todayAttendance: null, leaveBalances: [], myPendingLeaveRequests: 0, unreadNotifications };
  }
  const today = startOfDay(new Date());
  const tomorrow = addDays(today, 1);

  const todayAttendance = await prisma.attendance.findFirst({
    where: { employeeId: user.employeeId, date: { gte: today, lt: tomorrow } },
    select: { checkIn: true, checkOut: true, status: true },
  });
  const balances = await prisma.leaveBalance.findMany({
    where: { employeeId: user.employeeId, year: today.getFullYear() },
    include: { leaveType: { select: { name: true } } },
  });
  const myPendingLeaveRequests = await prisma.leaveRequest.count({
    where: { employeeId: user.employeeId, status: "Pending" },
  });

  return {
    scope: "personal",
    todayAttendance,
    leaveBalances: balances.map((b) => ({ leaveType: b.leaveType.name, remainingDays: b.remainingDays })),
    myPendingLeaveRequests,
    unreadNotifications,
  };
}
