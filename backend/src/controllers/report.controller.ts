import { z } from "zod";
import { asyncHandler } from "../utils/asyncHandler";
import { addDays, parseDateInput, startOfDay } from "../utils/dates";
import { ok } from "../utils/response";
import * as reportService from "../services/report.service";

const id = z.coerce.number().int().positive().optional();
const dateStr = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use format YYYY-MM-DD").optional();

// Default range: first day of this month to today.
function range(q: { from?: string; to?: string }) {
  const today = startOfDay(new Date());
  return {
    from: q.from ? parseDateInput(q.from, "from") : new Date(today.getFullYear(), today.getMonth(), 1),
    to: q.to ? parseDateInput(q.to, "to") : today,
  };
}

export const attendance = asyncHandler(async (req, res) => {
  const q = z.object({ from: dateStr, to: dateStr, employeeId: id, departmentId: id }).parse(req.query);
  ok(res, await reportService.attendanceReport(req.user!, range(q), { employeeId: q.employeeId, departmentId: q.departmentId }));
});

export const leave = asyncHandler(async (req, res) => {
  const q = z
    .object({
      from: dateStr,
      to: dateStr,
      employeeId: id,
      departmentId: id,
      leaveTypeId: id,
      status: z.enum(["Pending", "Approved", "Rejected", "Cancelled"]).optional(),
    })
    .parse(req.query);
  const r = range(q);
  // For leave, default to a wider window (this month to 30 days ahead) so upcoming requests show.
  const to = q.to ? r.to : addDays(r.to, 30);
  ok(res, await reportService.leaveReport(req.user!, { from: r.from, to }, q));
});

export const departments = asyncHandler(async (req, res) => {
  ok(res, await reportService.departmentReport(req.user!));
});
