import { api, USE_MOCK } from "./client";
import { mockPayroll } from "./mock";
import type { EmployeeLite, Payslip, SalaryStructure } from "../types";

// !! Endpoint paths are placeholders. Confirm them with Backend Intern 2 / docs/ API contract.

/** Employee list for the salary-setup dropdown (Frontend 2's /employees endpoint). */
export async function getEmployeesForPayroll(): Promise<EmployeeLite[]> {
  if (USE_MOCK) return mockPayroll.employees();
  return (await api.get<EmployeeLite[]>("/employees")).data;
}

export async function getSalary(employeeId: number): Promise<SalaryStructure> {
  if (USE_MOCK) return mockPayroll.getSalary(employeeId);
  return (await api.get<SalaryStructure>(`/payroll/salary/${employeeId}`)).data;
}

export async function saveSalary(s: SalaryStructure): Promise<SalaryStructure> {
  if (USE_MOCK) return mockPayroll.saveSalary(s);
  return (await api.put<SalaryStructure>(`/payroll/salary/${s.employeeId}`, s)).data;
}

/** Admin runs payroll for a month (YYYY-MM). Backend creates a payslip per active employee. */
export async function runPayroll(month: string): Promise<Payslip[]> {
  if (USE_MOCK) return mockPayroll.run(month);
  return (await api.post<Payslip[]>("/payroll/run", { month })).data;
}

/** Admin gets all payslips, Employee gets only their own (backend enforces this). */
export async function getPayslips(month?: string): Promise<Payslip[]> {
  if (USE_MOCK) return mockPayroll.list(month);
  return (await api.get<Payslip[]>("/payroll/payslips", { params: month ? { month } : undefined })).data;
}

/** Downloads the payslip PDF made by the backend. */
export async function downloadPayslipPdf(p: Payslip): Promise<void> {
  if (USE_MOCK) {
    window.print(); // no PDF in mock mode, so use the browser's "Save as PDF"
    return;
  }
  const res = await api.get(`/payroll/payslips/${p.id}/pdf`, { responseType: "blob" });
  const url = URL.createObjectURL(res.data as Blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `payslip-${p.employeeCode ?? p.employeeId}-${p.month}.pdf`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
