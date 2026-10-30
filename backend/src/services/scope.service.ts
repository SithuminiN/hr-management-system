import { prisma } from "../config/prisma";
import { ROLES } from "../config/roles";
import { AuthUser } from "../types/auth";

// Employee ids a Manager can see (their direct reports).
export async function teamEmployeeIds(user: AuthUser): Promise<number[]> {
  if (!user.employeeId) return [];
  const rows = await prisma.employee.findMany({ where: { managerId: user.employeeId }, select: { id: true } });
  return rows.map((r) => r.id);
}

// Admin: undefined (no restriction). Manager: team ids. Others: own id only.
export async function visibleEmployeeIds(user: AuthUser): Promise<number[] | undefined> {
  if (user.role === ROLES.ADMIN) return undefined;
  if (user.role === ROLES.MANAGER) return teamEmployeeIds(user);
  return user.employeeId ? [user.employeeId] : [];
}
