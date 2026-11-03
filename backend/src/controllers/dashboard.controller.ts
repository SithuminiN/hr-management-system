import { asyncHandler } from "../utils/asyncHandler";
import { ok } from "../utils/response";
import * as dashboardService from "../services/dashboard.service";

export const summary = asyncHandler(async (req, res) => {
  ok(res, await dashboardService.getSummary(req.user!));
});
