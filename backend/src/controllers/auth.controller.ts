import { z } from "zod";
import { asyncHandler } from "../utils/asyncHandler";
import { ok } from "../utils/response";
import * as authService from "../services/auth.service";

const loginSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = loginSchema.parse(req.body);
  ok(res, await authService.login(email, password));
});

// Tokens are stateless; the frontend deletes its copy. Kept so the contract endpoint exists.
export const logout = asyncHandler(async (_req, res) => {
  ok(res, { message: "Logged out" });
});

export const me = asyncHandler(async (req, res) => {
  ok(res, req.user);
});
