import { prisma } from "../config/prisma";
import { notifyUsers } from "./notification.service";

export function listAnnouncements() {
  return prisma.announcement.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
    include: { postedBy: { select: { email: true, employee: { select: { name: true } } } } },
  });
}

export async function createAnnouncement(postedById: number, title: string, body: string) {
  const announcement = await prisma.announcement.create({ data: { title, body, postedById } });
  const users = await prisma.user.findMany({
    where: { active: true, id: { not: postedById } },
    select: { id: true },
  });
  await notifyUsers(users.map((u) => u.id), `New announcement: ${title}`, "ANNOUNCEMENT");
  return announcement;
}
