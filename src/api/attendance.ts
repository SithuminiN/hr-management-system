import { api, USE_MOCK } from "./client";
import { mockAttendance } from "./mock";
import type { AttendanceRecord } from "../types";

// !! Endpoint paths are placeholders. Confirm them with Backend Intern 2 / docs/ API contract.

export async function checkIn(): Promise<AttendanceRecord> {
  if (USE_MOCK) return mockAttendance.checkIn();
  return (await api.post<AttendanceRecord>("/attendance/check-in")).data;
}

export async function checkOut(): Promise<AttendanceRecord> {
  if (USE_MOCK) return mockAttendance.checkOut();
  return (await api.post<AttendanceRecord>("/attendance/check-out")).data;
}

export async function getAttendanceHistory(params?: { from?: string; to?: string }): Promise<AttendanceRecord[]> {
  if (USE_MOCK) return mockAttendance.history(params);
  return (await api.get<AttendanceRecord[]>("/attendance/history", { params })).data;
}
