import type { NextFunction, Request, Response } from "express";
import { sendError, sendSuccess } from "../../../../utils/response.js";
import { ZodEmail } from "zod";
import { createUser, getUserById } from "./user.service.js";
import { createUserSchema, getUserSchema } from "./user.schema.js";

interface UserParams {
  id: string;
}
interface UserInputParams {
  name: string;
  email: ZodEmail;
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

export async function createUserController(
  req: Request<{}, {}, UserInputParams>,
  res: Response,
  next: NextFunction,
) {
  const { name, email } = createUserSchema.parse(req.body);
  const user = await createUser({ name, email });

  if (!user) {
    throw new Error(`User couldn't be created`);
  }
  return sendSuccess(res, user, 201);
}
