// In-memory fake backend so you can build & demo the UI before the real API is ready.
// Turn it on with  VITE_USE_MOCK=true  in frontend/.env  (remove it when the backend is ready).
// NOTE: payroll maths here only imitates the SRS demo rules. The REAL calculation is done by the backend.
import type {
  ApplyLeaveInput, AttendanceRecord, EmployeeLite, LeaveBalance, LeaveRequest,
  LeaveType, Payslip, SalaryStructure, User,
} from "../types";
import { daysBetween, todayStr } from "../utils/format";
import { getSessionUser } from "./session";

const wait = (ms = 250) => new Promise((r) => setTimeout(r, ms));
const clone = <T,>(x: T): T => JSON.parse(JSON.stringify(x));

function me(): User {
  const u = getSessionUser();
  if (!u) return { id: 3, employeeId: 3, name: "Sunil Fernando (Employee)", role: "Employee" };
  return u;
}

const EMPLOYEES: EmployeeLite[] = [
  { id: 1, name: "Nimal Perera", employeeCode: "EMP-001" },
  { id: 2, name: "Kamal Silva", employeeCode: "EMP-002" },
  { id: 3, name: "Sunil Fernando", employeeCode: "EMP-003" },
  { id: 4, name: "Amali Jayasinghe", employeeCode: "EMP-004" },
];
const nameOf = (id: number) => EMPLOYEES.find((e) => e.id === id)?.name ?? `Employee ${id}`;
const MANAGER_TEAM = [3, 4]; // Kamal (id 2) manages Sunil and Amali

const addDays = (date: string, n: number) => {
  const d = new Date(`${date}T00:00:00`);
  d.setDate(d.getDate() + n);
  const p = (x: number) => String(x).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
};
const at = (date: string, hhmm: string) => new Date(`${date}T${hhmm}:00`).toISOString();

/* ============================ ATTENDANCE ============================ */
let attId = 1;
const attendance: AttendanceRecord[] = [];
for (const empId of [3, 4]) {
  for (let i = 1; i <= 5; i++) {
    const date = addDays(todayStr(), -i);
    const late = (i + empId) % 4 === 0;
    const inT = late ? "09:05" : "08:20";
    const outT = "17:30";
    const worked = late ? 505 - 0 : 550;
    attendance.push({
      id: attId++, employeeId: empId, employeeName: nameOf(empId), date,
      checkIn: at(date, inT), checkOut: at(date, outT),
      status: late ? "Late" : "Present", workedMinutes: worked, overtimeMinutes: Math.max(0, worked - 480),
    });
  }
}

function visibleEmployeeIds(u: User): number[] | "all" {
  if (u.role === "Admin") return "all";
  if (u.role === "Manager") return [u.employeeId, ...MANAGER_TEAM];
  return [u.employeeId];
}

export const mockAttendance = {
  async checkIn(): Promise<AttendanceRecord> {
    await wait();
    const u = me();
    if (attendance.some((a) => a.employeeId === u.employeeId && !a.checkOut)) {
      throw new Error("You already have an open check-in. Please check out first.");
    }
    const now = new Date();
    const late = now.getHours() * 60 + now.getMinutes() > 8 * 60 + 45; // 08:30 + 15 min grace
    const rec: AttendanceRecord = {
      id: attId++, employeeId: u.employeeId, employeeName: nameOf(u.employeeId), date: todayStr(),
      checkIn: now.toISOString(), checkOut: null, status: late ? "Late" : "Present",
      workedMinutes: 0, overtimeMinutes: 0,
    };
    attendance.push(rec);
    return clone(rec);
  },
  async checkOut(): Promise<AttendanceRecord> {
    await wait();
    const u = me();
    const rec = attendance.find((a) => a.employeeId === u.employeeId && !a.checkOut);
    if (!rec) throw new Error("You have not checked in yet, so you cannot check out.");
    const now = new Date();
    rec.checkOut = now.toISOString();
    rec.workedMinutes = Math.max(0, Math.round((now.getTime() - new Date(rec.checkIn as string).getTime()) / 60000));
    rec.overtimeMinutes = Math.max(0, rec.workedMinutes - 480);
    if (rec.status !== "Late" && now.getHours() < 17) rec.status = "Early";
    return clone(rec);
  },
  async history(params?: { from?: string; to?: string }): Promise<AttendanceRecord[]> {
    await wait();
    const ids = visibleEmployeeIds(me());
    return clone(
      attendance
        .filter((a) => ids === "all" || ids.includes(a.employeeId))
        .filter((a) => (!params?.from || a.date >= params.from) && (!params?.to || a.date <= params.to))
        .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : b.id - a.id)),
    );
  },
};

/* ============================== LEAVE ============================== */
const leaveTypes: LeaveType[] = [
  { id: 1, name: "Annual", daysPerYear: 14 },
  { id: 2, name: "Sick", daysPerYear: 7 },
  { id: 3, name: "Casual", daysPerYear: 7 },
];
let leaveId = 1;
const leaves: LeaveRequest[] = [];
const typeName = (id: number) => leaveTypes.find((t) => t.id === id)?.name ?? "Unknown";
function seedLeave(emp: number, type: number, s: number, e: number, reason: string, status: LeaveRequest["status"]) {
  leaves.push({
    id: leaveId++, employeeId: emp, employeeName: nameOf(emp), leaveTypeId: type, leaveTypeName: typeName(type),
    startDate: addDays(todayStr(), s), endDate: addDays(todayStr(), e), reason, status,
    decidedByName: status === "Approved" || status === "Rejected" ? "Kamal Silva" : null,
    decidedAt: status === "Approved" || status === "Rejected" ? new Date().toISOString() : null,
  });
}
seedLeave(3, 1, 10, 12, "Family function in Kandy", "Pending");
seedLeave(4, 2, -8, -7, "Fever and doctor's advice", "Approved");
seedLeave(4, 3, 20, 20, "Bank work", "Pending");
seedLeave(3, 3, -20, -20, "Personal errand", "Rejected");

const remaining = (emp: number, type: number) => {
  const t = leaveTypes.find((x) => x.id === type);
  const used = leaves
    .filter((l) => l.employeeId === emp && l.leaveTypeId === type && l.status === "Approved")
    .reduce((sum, l) => sum + daysBetween(l.startDate, l.endDate), 0);
  return (t?.daysPerYear ?? 0) - used;
};

export const mockLeave = {
  async types(): Promise<LeaveType[]> { await wait(100); return clone(leaveTypes); },
  async balances(): Promise<LeaveBalance[]> {
    await wait(100);
    const u = me();
    return leaveTypes.map((t) => ({ leaveTypeId: t.id, leaveTypeName: t.name, remainingDays: remaining(u.employeeId, t.id) }));
  },
  async list(): Promise<LeaveRequest[]> {
    await wait();
    const ids = visibleEmployeeIds(me());
    return clone(leaves.filter((l) => ids === "all" || ids.includes(l.employeeId)).sort((a, b) => b.id - a.id));
  },
  async apply(input: ApplyLeaveInput): Promise<LeaveRequest> {
    await wait();
    const u = me();
    const days = daysBetween(input.startDate, input.endDate);
    if (days <= 0) throw new Error("End date cannot be before the start date.");
    const left = remaining(u.employeeId, input.leaveTypeId);
    if (days > left) throw new Error(`Not enough ${typeName(input.leaveTypeId)} leave balance. You have ${left} day(s) left.`);
    const req: LeaveRequest = {
      id: leaveId++, employeeId: u.employeeId, employeeName: nameOf(u.employeeId),
      leaveTypeId: input.leaveTypeId, leaveTypeName: typeName(input.leaveTypeId),
      startDate: input.startDate, endDate: input.endDate, reason: input.reason, status: "Pending",
    };
    leaves.push(req);
    return clone(req);
  },
  async decide(id: number, status: "Approved" | "Rejected"): Promise<LeaveRequest> {
    await wait();
    const u = me();
    const req = leaves.find((l) => l.id === id);
    if (!req) throw new Error("Leave request not found.");
    if (u.role === "Employee") throw new Error("You are not allowed to approve or reject leave.");
    if (req.employeeId === u.employeeId) throw new Error("You cannot approve or reject your own request.");
    if (u.role === "Manager" && !MANAGER_TEAM.includes(req.employeeId)) throw new Error("This employee is not in your team.");
    if (req.status !== "Pending") throw new Error("Only pending requests can be decided.");
    if (status === "Approved") {
      const left = remaining(req.employeeId, req.leaveTypeId);
      if (daysBetween(req.startDate, req.endDate) > left) throw new Error("Employee does not have enough leave balance.");
    }
    req.status = status;
    req.decidedByName = u.name.replace(/\s*\(.*\)/, "");
    req.decidedAt = new Date().toISOString();
    return clone(req);
  },
  async cancel(id: number): Promise<LeaveRequest> {
    await wait();
    const u = me();
    const req = leaves.find((l) => l.id === id);
    if (!req) throw new Error("Leave request not found.");
    if (req.employeeId !== u.employeeId) throw new Error("You can only cancel your own requests.");
    const notStarted = req.startDate > todayStr();
    if (req.status === "Pending" || (req.status === "Approved" && notStarted)) {
      req.status = "Cancelled";
      return clone(req);
    }
    throw new Error("This request can no longer be cancelled.");
  },
};

/* ============================== PAYROLL ============================== */
const salaries: Record<number, SalaryStructure> = {
  1: { employeeId: 1, basicSalary: 150000, allowances: [{ name: "Transport", amount: 15000 }], deductions: [] },
  2: { employeeId: 2, basicSalary: 110000, allowances: [{ name: "Transport", amount: 10000 }], deductions: [{ name: "Loan", amount: 5000 }] },
  3: { employeeId: 3, basicSalary: 80000, allowances: [{ name: "Meal", amount: 5000 }], deductions: [] },
  4: { employeeId: 4, basicSalary: 85000, allowances: [], deductions: [{ name: "Staff welfare", amount: 1000 }] },
};
let payslipId = 1;
const payslips: Payslip[] = [];

function buildPayslip(emp: EmployeeLite, month: string, s: SalaryStructure): Payslip {
  const overtimeHours = 4; // demo value
  const hourlyRate = s.basicSalary / 200;
  const overtimePay = Math.round(overtimeHours * hourlyRate * 1.5 * 100) / 100;
  const epfEmployee = Math.round(s.basicSalary * 0.08 * 100) / 100;
  const allow = s.allowances.reduce((a, b) => a + b.amount, 0);
  const deduct = s.deductions.reduce((a, b) => a + b.amount, 0);
  return {
    id: payslipId++, employeeId: emp.id, employeeName: emp.name, employeeCode: emp.employeeCode, month,
    basicSalary: s.basicSalary, allowances: clone(s.allowances), deductions: clone(s.deductions),
    overtimeHours, overtimePay, epfEmployee,
    epfEmployer: Math.round(s.basicSalary * 0.12 * 100) / 100,
    etfEmployer: Math.round(s.basicSalary * 0.03 * 100) / 100,
    netSalary: Math.round((s.basicSalary + allow + overtimePay - deduct - epfEmployee) * 100) / 100,
  };
}
{
  const lastMonth = addDays(todayStr(), -30).slice(0, 7);
  for (const e of EMPLOYEES) payslips.push(buildPayslip(e, lastMonth, salaries[e.id]));
}

export const mockPayroll = {
  async employees(): Promise<EmployeeLite[]> { await wait(100); return clone(EMPLOYEES); },
  async getSalary(employeeId: number): Promise<SalaryStructure> {
    await wait(150);
    return clone(salaries[employeeId] ?? { employeeId, basicSalary: 0, allowances: [], deductions: [] });
  },
  async saveSalary(s: SalaryStructure): Promise<SalaryStructure> {
    await wait();
    if (me().role !== "Admin") throw new Error("Only Admin can change salary details.");
    if (s.basicSalary < 0) throw new Error("Basic salary cannot be negative.");
    salaries[s.employeeId] = clone(s);
    return clone(s);
  },
  async run(month: string): Promise<Payslip[]> {
    await wait(500);
    if (me().role !== "Admin") throw new Error("Only Admin can run payroll.");
    if (payslips.some((p) => p.month === month)) throw new Error(`Payroll for ${month} has already been run.`);
    const created = EMPLOYEES.filter((e) => salaries[e.id]).map((e) => buildPayslip(e, month, salaries[e.id]));
    payslips.push(...created);
    return clone(created);
  },
  async list(month?: string): Promise<Payslip[]> {
    await wait();
    const u = me();
    if (u.role === "Manager") throw new Error("Managers do not have access to payroll.");
    return clone(
      payslips
        .filter((p) => u.role === "Admin" || p.employeeId === u.employeeId)
        .filter((p) => !month || p.month === month)
        .sort((a, b) => (a.month < b.month ? 1 : a.month > b.month ? -1 : a.employeeId - b.employeeId)),
    );
  },
};
