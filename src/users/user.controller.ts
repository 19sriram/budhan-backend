import type { NextFunction, Request, Response } from "express";
import { getUserById } from "./user.service.js";
import { sendError, sendSuccess, sendZodError } from "../utils/response.js";
import { getUserSchema } from "./user.schema.js";
import { ZodError } from "zod";

interface UserParams {
  id: string;
}
export async function getUserController(
  req: Request<UserParams>,
  res: Response,
  next: NextFunction,
) {
  const { id } = getUserSchema.parse(req.params);
  const user = await getUserById(id);
  if (!user) {
    return sendError(res, "User not found", 404);
  }
  return sendSuccess(res, user);
}
