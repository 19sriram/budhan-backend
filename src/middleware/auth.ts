import "dotenv/config";
import jwt from "jsonwebtoken";
import type { Request, Response, NextFunction } from "express";

export const authMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const authHeader = req.headers.authorization;
  const JWT_SECRET = process.env.JWT_SECRET!;
  if (!authHeader) {
    return res.status(401).json({
      message: "Not authorized",
    });
  }
  const [scheme, token] = authHeader.split(" ");
  if (scheme !== "Bearer" || !token) {
    return res.status(401).json({
      message: "Invalid authorization",
    });
  }
  try {
    const payload = jwt.verify(token, JWT_SECRET) as {
      id: string;
      email: string;
    };
    req.user = { id: payload.id, email: payload.email };
    next();
  } catch {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};
