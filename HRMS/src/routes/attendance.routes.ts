import { Router, Request, Response } from "express";
import prisma from "../config/prisma";

const router = Router();

// Helper to get today's date at 00:00:00
const getTodayDate = () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
};

// GET: All attendance
router.get("/", async (req: Request, res: Response) => {
  try {
    const attendances = await prisma.attendance.findMany({
      orderBy: { date: "desc" },
      include: { employee: true }
    });
    return res.status(200).json({ data: attendances });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Failed to get attendance" });
  }
});

// GET: Attendance by employee
router.get("/employee/:employeeId", async (req: Request, res: Response) => {
  try {
    const employeeId = Number(req.params.employeeId);
    const data = await prisma.attendance.findMany({
      where: { employeeId },
      orderBy: { date: "desc" }
    });
    return res.status(200).json({ data });
  } catch (error) {
    return res.status(500).json({ message: "Failed to get attendance" });
  }
});

// POST: Check-in
router.post("/check-in", async (req: Request, res: Response) => {
  try {
    const { employeeId } = req.body;
    if (!employeeId) return res.status(400).json({ message: "employeeId required" });

    const today = getTodayDate();

    const existing = await prisma.attendance.findUnique({
      where: {
        employeeId_date: {
          employeeId: Number(employeeId),
          date: today
        }
      }
    });

    if (existing) {
      return res.status(400).json({ message: "Already checked in today", data: existing });
    }

    const now = new Date();
    const lateTime = new Date();
    lateTime.setHours(9, 15, 0, 0);
    const status = now > lateTime ? "Late" : "PRESENT";

    const attendance = await prisma.attendance.create({
      data: {
        employeeId: Number(employeeId),
        date: today,
        checkIn: now,
        status
      }
    });

    return res.status(201).json({ message: "Checked in successfully", data: attendance });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Failed to check in" });
  }
});

// POST: Check-out
router.post("/check-out", async (req: Request, res: Response) => {
  try {
    const { employeeId } = req.body;
    if (!employeeId) return res.status(400).json({ message: "employeeId required" });

    const today = getTodayDate();

    const existing = await prisma.attendance.findUnique({
      where: {
        employeeId_date: {
          employeeId: Number(employeeId),
          date: today
        }
      }
    });

    if (!existing) {
      return res.status(400).json({ message: "No check-in found for today" });
    }

    if (existing.checkOut) {
      return res.status(400).json({ message: "Already checked out" });
    }

    const updated = await prisma.attendance.update({
      where: { id: existing.id },
      data: { checkOut: new Date() }
    });

    return res.status(200).json({ message: "Checked out successfully", data: updated });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Failed to check out" });
  }
});

export default router;