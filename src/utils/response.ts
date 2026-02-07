import type { Response } from "express";
import { ZodError } from "zod";

export function sendError(res: Response, message: string, status = 400) {
  return res.status(status).json({
    message,
  });
}

export function sendZodError(
  res: Response,
  error: ZodError<unknown>,
  status = 400,
) {
  return res.status(status).json({
    message: error.issues.map((e) => e.message).join(", "),
  });
}

export function sendSuccess<T>(res: Response, data: T, status = 200) {
  return res.status(status).json(data);
}
