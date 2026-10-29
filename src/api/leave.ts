import { api, USE_MOCK } from "./client";
import { mockLeave } from "./mock";
import type { ApplyLeaveInput, LeaveBalance, LeaveRequest, LeaveType } from "../types";

// !! Endpoint paths are placeholders. Confirm them with Backend Intern 2 / docs/ API contract.

export async function getLeaveTypes(): Promise<LeaveType[]> {
  if (USE_MOCK) return mockLeave.types();
  return (await api.get<LeaveType[]>("/leave/types")).data;
}

export async function getLeaveBalances(): Promise<LeaveBalance[]> {
  if (USE_MOCK) return mockLeave.balances();
  return (await api.get<LeaveBalance[]>("/leave/balance")).data;
}

/** Backend decides what each role sees: Admin = all, Manager = own team, Employee = own. */
export async function getLeaveRequests(): Promise<LeaveRequest[]> {
  if (USE_MOCK) return mockLeave.list();
  return (await api.get<LeaveRequest[]>("/leave")).data;
}

export async function applyLeave(input: ApplyLeaveInput): Promise<LeaveRequest> {
  if (USE_MOCK) return mockLeave.apply(input);
  return (await api.post<LeaveRequest>("/leave", input)).data;
}

export async function decideLeave(id: number, status: "Approved" | "Rejected"): Promise<LeaveRequest> {
  if (USE_MOCK) return mockLeave.decide(id, status);
  return (await api.patch<LeaveRequest>(`/leave/${id}/decision`, { status })).data;
}

export async function cancelLeave(id: number): Promise<LeaveRequest> {
  if (USE_MOCK) return mockLeave.cancel(id);
  return (await api.patch<LeaveRequest>(`/leave/${id}/cancel`)).data;
}
