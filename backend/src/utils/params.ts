import { Request } from "express";
import { HttpError } from "./httpError";

export function idParam(req: Request, name = "id"): number {
  const value = Number(req.params[name]);
  if (!Number.isInteger(value) || value <= 0) {
    throw new HttpError(400, "Invalid id", [{ field: name, message: "Must be a positive whole number" }]);
  }
  return value;
}
