import { Router, Request, Response } from "express";
import prisma from "../config/prisma";

const router = Router();

// GET: All leaves
router.get("/", async (req: Request, res: Response) => {
  try {
    const leaves = await prisma.leave.findMany({
      orderBy: { id: "desc" },
      include: { employee: true }
    });
    return res.status(200).json({
      message: "Leaves retrieved successfully",
      data: leaves
    });
  } catch (error) {
    console.error("Error retrieving leaves:", error);
    return res.status(500).json({ message: "Failed to retrieve leaves" });
  }
});

// GET: Leaves by employee ID
router.get("/employee/:employeeId", async (req: Request, res: Response) => {
  try {
    const employeeId = Number(req.params.employeeId);
    if (!employeeId) return res.status(400).json({ message: "Invalid employee ID" });

    const leaves = await prisma.leave.findMany({
      where: { employeeId },
      orderBy: { id: "desc" }
    });
    return res.status(200).json({ data: leaves });
  } catch (error) {
    return res.status(500).json({ message: "Failed to retrieve leaves" });
  }
});

// POST: Apply leave
router.post("/", async (req: Request, res: Response) => {
  try {
    const { employeeId, leaveType, startDate, endDate, reason } = req.body;

    if (!employeeId || !leaveType || !startDate || !endDate) {
      return res.status(400).json({
        message: "employeeId, leaveType, startDate, endDate are required"
      });
    }

    const employee = await prisma.employee.findUnique({
      where: { id: Number(employeeId) }
    });

    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }

    const leave = await prisma.leave.create({
      data: {
        employeeId: Number(employeeId),
        leaveType,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        reason: reason || "",
        status: "PENDING"
      }
    });

    return res.status(201).json({
      message: "Leave applied successfully",
      data: leave
    });
  } catch (error) {
    console.error("Error creating leave:", error);
    return res.status(500).json({ message: "Failed to apply leave" });
  }
});

// PATCH: Approve leave
router.patch("/:id/approve", async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const leave = await prisma.leave.update({
      where: { id },
      data: { status: "APPROVED" }
    });
    return res.status(200).json({ message: "Leave approved", data: leave });
  } catch (error) {
    return res.status(500).json({ message: "Failed to approve leave" });
  }
});

// PATCH: Reject leave
router.patch("/:id/reject", async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const leave = await prisma.leave.update({
      where: { id },
      data: { status: "REJECTED" }
    });
    return res.status(200).json({ message: "Leave rejected", data: leave });
  } catch (error) {
    return res.status(500).json({ message: "Failed to reject leave" });
  }
});

// DELETE: Delete leave
router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    await prisma.leave.delete({ where: { id } });
    return res.status(200).json({ message: "Leave deleted successfully" });
  } catch (error) {
    return res.status(500).json({ message: "Failed to delete leave" });
  }
});

export default router;