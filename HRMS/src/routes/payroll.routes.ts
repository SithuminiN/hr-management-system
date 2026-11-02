import { Router, Request, Response } from "express";
import prisma from "../config/prisma";

const router = Router();

// GET: All payrolls
router.get("/", async (req: Request, res: Response) => {
  try {
    const payrolls = await prisma.payroll.findMany({
      orderBy: [{ year: "desc" }, { month: "desc" }],
      include: { employee: true }
    });
    return res.status(200).json({ data: payrolls });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Failed to get payrolls" });
  }
});

// GET: Payroll by employee
router.get("/employee/:employeeId", async (req: Request, res: Response) => {
  try {
    const employeeId = Number(req.params.employeeId);
    const payrolls = await prisma.payroll.findMany({
      where: { employeeId },
      orderBy: [{ year: "desc" }, { month: "desc" }]
    });
    return res.status(200).json({ data: payrolls });
  } catch (error) {
    return res.status(500).json({ message: "Failed to get payrolls" });
  }
});

// POST: Create payroll (salary generate)
router.post("/", async (req: Request, res: Response) => {
  try {
    const { employeeId, month, year, basicSalary, overtime, deductions } = req.body;

    if (!employeeId || !month || !year || !basicSalary) {
      return res.status(400).json({ message: "employeeId, month, year, basicSalary required" });
    }

    const ot = Number(overtime) || 0;
    const ded = Number(deductions) || 0;
    const basic = Number(basicSalary);
    const netSalary = basic + ot - ded;

    const payroll = await prisma.payroll.create({
      data: {
        employeeId: Number(employeeId),
        month: Number(month),
        year: Number(year),
        basicSalary: basic,
        overtime: ot,
        deductions: ded,
        netSalary,
        status: "PENDING"
      }
    });

    return res.status(201).json({ message: "Payroll created", data: payroll });
  } catch (error: any) {
    console.error(error);
    if (error.code === "P2002") {
      return res.status(400).json({ message: "Payroll already exists for this month" });
    }
    return res.status(500).json({ message: "Failed to create payroll" });
  }
});

// PATCH: Mark as PAID
router.patch("/:id/pay", async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const payroll = await prisma.payroll.update({
      where: { id },
      data: { status: "PAID" }
    });
    return res.status(200).json({ message: "Payroll marked as PAID", data: payroll });
  } catch (error) {
    return res.status(500).json({ message: "Failed to update payroll" });
  }
});

// DELETE
router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    await prisma.payroll.delete({ where: { id } });
    return res.status(200).json({ message: "Payroll deleted" });
  } catch (error) {
    return res.status(500).json({ message: "Failed to delete payroll" });
  }
});

export default router;