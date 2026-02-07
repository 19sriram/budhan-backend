import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Request, Response } from "express";
import jwt from "jsonwebtoken";

// Set env before importing the controller
process.env.JWT_SECRET = "test-secret";

vi.mock("jsonwebtoken");
vi.mock("../../db/prisma.js", () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
  },
}));

import { loginController } from "./login.controller.js";
import { prisma } from "../../db/prisma.js";

const mockResponse = () => {
  const res = {} as Response;
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
};

const mockUser = {
  id: "user-123",
  email: "test@example.com",
  name: "Test User",
  createdAt: new Date(),
};

describe("Login Controller", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Input Validation", () => {
    it("should return 400 when email is missing", async () => {
      const req = { body: {} } as Request;
      const res = mockResponse();

      await loginController(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: "Email required" });
      expect(prisma.user.findUnique).not.toHaveBeenCalled();
    });

    it("should return 400 when email is empty string", async () => {
      const req = { body: { email: "" } } as Request;
      const res = mockResponse();

      await loginController(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: "Email required" });
    });

    it("should return 400 when email is null", async () => {
      const req = { body: { email: null } } as Request;
      const res = mockResponse();

      await loginController(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: "Email required" });
    });
  });

  describe("User Lookup", () => {
    it("should return 401 when user is not found", async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

      const req = { body: { email: "notfound@example.com" } } as Request;
      const res = mockResponse();

      await loginController(req, res);

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: "notfound@example.com" },
      });
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        message: "Cannot found the email entered",
      });
    });
  });

  describe("Token Generation", () => {
    it("should return token when user is found", async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser);
      vi.mocked(jwt.sign).mockReturnValue("generated-token" as any);

      const req = { body: { email: mockUser.email } } as Request;
      const res = mockResponse();

      await loginController(req, res);

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: mockUser.email },
      });
      // Verify jwt.sign was called with correct payload and options
      const signCall = vi.mocked(jwt.sign).mock.calls[0];
      expect(signCall[0]).toEqual({ id: mockUser.id, email: mockUser.email });
      expect(signCall[2]).toEqual({ expiresIn: "1h" });
      expect(res.json).toHaveBeenCalledWith({ token: "generated-token" });
      expect(res.status).not.toHaveBeenCalled();
    });

    it("should include correct payload in token", async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser);
      vi.mocked(jwt.sign).mockReturnValue("token" as any);

      const req = { body: { email: mockUser.email } } as Request;
      const res = mockResponse();

      await loginController(req, res);

      const signCall = vi.mocked(jwt.sign).mock.calls[0];
      expect(signCall[0]).toEqual({
        id: mockUser.id,
        email: mockUser.email,
      });
    });

    it("should set token expiration to 1 hour", async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser);
      vi.mocked(jwt.sign).mockReturnValue("token" as any);

      const req = { body: { email: mockUser.email } } as Request;
      const res = mockResponse();

      await loginController(req, res);

      const signCall = vi.mocked(jwt.sign).mock.calls[0];
      expect(signCall[2]).toEqual({ expiresIn: "1h" });
    });
  });

  describe("Database Errors", () => {
    it("should propagate database errors", async () => {
      vi.mocked(prisma.user.findUnique).mockRejectedValue(
        new Error("Database connection failed")
      );

      const req = { body: { email: "test@example.com" } } as Request;
      const res = mockResponse();

      await expect(loginController(req, res)).rejects.toThrow(
        "Database connection failed"
      );
    });
  });
});
