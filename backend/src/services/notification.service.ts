import { prisma } from "../config/prisma";
import { HttpError } from "../utils/httpError";

// ---- Helper functions other modules call (leave, attendance, announcements) ----

export async function createNotification(userId: number, message: string, type: string) {
  return prisma.notification.create({ data: { userId, message, type } });
}

export async function notifyUsers(userIds: number[], message: string, type: string) {
  if (userIds.length === 0) return { count: 0 };
  return prisma.notification.createMany({ data: userIds.map((userId) => ({ userId, message, type })) });
}

export async function notifyRoles(roleNames: string[], message: string, type: string, excludeUserId?: number) {
  const users = await prisma.user.findMany({
    where: { active: true, role: { name: { in: roleNames } }, ...(excludeUserId ? { id: { not: excludeUserId } } : {}) },
    select: { id: true },
  });
  return notifyUsers(users.map((u) => u.id), message, type);
}

// ---- Used by the API ----

export function listNotifications(userId: number, unreadOnly: boolean) {
  return prisma.notification.findMany({
    where: { userId, ...(unreadOnly ? { isRead: false } : {}) },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
}

export async function markAsRead(userId: number, id: number) {
  const found = await prisma.notification.findFirst({ where: { id, userId } });
  if (!found) throw new HttpError(404, "Notification not found");
  return prisma.notification.update({ where: { id }, data: { isRead: true } });
}

export async function markAllAsRead(userId: number) {
  const result = await prisma.notification.updateMany({ where: { userId, isRead: false }, data: { isRead: true } });
  return { updated: result.count };
}
