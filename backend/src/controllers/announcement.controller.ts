import { z } from "zod";
import { asyncHandler } from "../utils/asyncHandler";
import { ok } from "../utils/response";
import * as announcementService from "../services/announcement.service";

const createSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(150, "Title is too long"),
  body: z.string().trim().min(1, "Body is required").max(5000, "Body is too long"),
});

export const list = asyncHandler(async (_req, res) => {
  ok(res, await announcementService.listAnnouncements());
});

export const create = asyncHandler(async (req, res) => {
  const { title, body } = createSchema.parse(req.body);
  ok(res, await announcementService.createAnnouncement(req.user!.id, title, body), 201);
});
