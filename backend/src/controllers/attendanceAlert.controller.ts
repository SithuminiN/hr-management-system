import { asyncHandler } from "../utils/asyncHandler";
import { ok } from "../utils/response";
import * as alertService from "../services/attendanceAlert.service";

// Manual trigger (useful for demo and testing). The scheduled job calls the same function.
export const run = asyncHandler(async (_req, res) => {
  ok(res, await alertService.runAttendanceAlerts());
});
