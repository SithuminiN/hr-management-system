export type Role = "Admin" | "Manager" | "Employee";

export interface User {
  id: number;
  employeeId: number;
  name: string;
  role: Role;
}

/* ---------- Attendance ---------- */
export type AttendanceStatus = "Present" | "Late" | "Early" | "Absent" | "On Leave";

export interface AttendanceRecord {
  id: number;
  employeeId: number;
  employeeName?: string;
  date: string; // YYYY-MM-DD
  checkIn: string | null; // ISO string or HH:MM
  checkOut: string | null;
  status: AttendanceStatus;
  workedMinutes: number;
  overtimeMinutes: number;
}

/* ---------- Leave ---------- */
export type LeaveStatus = "Pending" | "Approved" | "Rejected" | "Cancelled";

export interface LeaveType {
  id: number;
  name: string;
  daysPerYear: number;
}

export interface LeaveBalance {
  leaveTypeId: number;
  leaveTypeName: string;
  remainingDays: number;
}

export interface LeaveRequest {
  id: number;
  employeeId: number;
  employeeName?: string;
  leaveTypeId: number;
  leaveTypeName: string;
  startDate: string;
  endDate: string;
  reason: string;
  status: LeaveStatus;
  decidedByName?: string | null;
  decidedAt?: string | null;
}

export interface ApplyLeaveInput {
  leaveTypeId: number;
  startDate: string;
  endDate: string;
  reason: string;
}

/* ---------- Payroll ---------- */
export interface EmployeeLite {
  id: number;
  name: string;
  employeeCode: string;
}

export interface NamedAmount {
  name: string;
  amount: number;
}

export interface SalaryStructure {
  employeeId: number;
  basicSalary: number;
  allowances: NamedAmount[];
  deductions: NamedAmount[];
}

export interface Payslip {
  id: number;
  employeeId: number;
  employeeName: string;
  employeeCode?: string;
  month: string; // YYYY-MM
  basicSalary: number;
  allowances: NamedAmount[];
  deductions: NamedAmount[];
  overtimeHours: number;
  overtimePay: number;
  epfEmployee: number;
  epfEmployer: number;
  etfEmployer: number;
  netSalary: number;
}
