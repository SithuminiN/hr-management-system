import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env";
import { prisma } from "../config/prisma";
import { asyncHandler } from "../utils/asyncHandler";
import { HttpError } from "../utils/httpError";

// Checks the token on every protected request (AUTH-7).
// NOTE: Backend Intern 1 owns authentication. If their version is merged, keep theirs
// and make sure it also sets req.user = { id, email, role, employeeId }.
export const authenticate = asyncHandler(async (req, _res, next) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) throw new HttpError(401, "Not logged in");

  let userId: number;
  try {
    const payload = jwt.verify(header.slice(7), env.jwtSecret) as unknown as { sub: number | string };
    userId = Number(payload.sub);
  } catch {
    throw new HttpError(401, "Invalid or expired token");
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { role: true, employee: true },
  });
  if (!user || !user.active) throw new HttpError(401, "Account not found or inactive");
  if (user.employee && user.employee.status === "Inactive") throw new HttpError(401, "Account is inactive");

  req.user = { id: user.id, email: user.email, role: user.role.name, employeeId: user.employeeId };
  next();
});

export function authorize(...allowed: string[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) return next(new HttpError(401, "Not logged in"));
    if (!allowed.includes(req.user.role)) return next(new HttpError(403, "You are not allowed to do this"));
    next();
  };
}
