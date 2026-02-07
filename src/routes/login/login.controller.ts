import type { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { prisma } from "../../db/prisma.js";

const JWT_SECRET = process.env.JWT_SECRET!;

export const loginController = async (req: Request, res: Response) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: "Email required" });
  }

  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    return res.status(401).json({ message: "Cannot found the email entered" });
  }

  const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, {
    expiresIn: "1h",
  });

  res.json({ token });
};
