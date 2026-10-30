import { asyncHandler } from "../utils/asyncHandler";
import { idParam } from "../utils/params";
import { ok } from "../utils/response";
import * as notificationService from "../services/notification.service";

export const list = asyncHandler(async (req, res) => {
  ok(res, await notificationService.listNotifications(req.user!.id, req.query.unread === "true"));
});

export const markRead = asyncHandler(async (req, res) => {
  ok(res, await notificationService.markAsRead(req.user!.id, idParam(req)));
});

export const markAllRead = asyncHandler(async (req, res) => {
  ok(res, await notificationService.markAllAsRead(req.user!.id));
});
