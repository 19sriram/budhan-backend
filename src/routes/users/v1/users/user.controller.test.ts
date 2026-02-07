import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Request, Response, NextFunction } from "express";
import { getUserController, createUserController } from "./user.controller.js";
import { ZodError } from "zod";

vi.mock("./user.service.js", () => ({
  getUserById: vi.fn(),
  createUser: vi.fn(),
}));

import { getUserById, createUser } from "./user.service.js";

const mockResponse = () => {
  const res = {} as Response;
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
};

const mockNext = vi.fn() as NextFunction;

const mockUser = {
  id: "550e8400-e29b-41d4-a716-446655440000",
  email: "test@example.com",
  name: "Test User",
  createdAt: new Date("2024-01-01"),
};

describe("User Controller", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getUserController", () => {
    it("should return user when found", async () => {
      vi.mocked(getUserById).mockResolvedValue(mockUser);

      const req = {
        params: { id: mockUser.id },
      } as Request<{ id: string }>;
      const res = mockResponse();

      await getUserController(req, res, mockNext);

      expect(getUserById).toHaveBeenCalledWith(mockUser.id);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockUser);
    });

    it("should return 404 when user not found", async () => {
      vi.mocked(getUserById).mockResolvedValue(null);
      const nonExistentUuid = "550e8400-e29b-41d4-a716-446655440001";

      const req = {
        params: { id: nonExistentUuid },
      } as unknown as Request<{ id: string }>;
      const res = mockResponse();

      await getUserController(req, res, mockNext);

      expect(getUserById).toHaveBeenCalledWith(nonExistentUuid);
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: "User not found" });
    });

    it("should throw ZodError for invalid UUID format", async () => {
      const req = {
        params: { id: "invalid-uuid" },
      } as Request<{ id: string }>;
      const res = mockResponse();

      await expect(getUserController(req, res, mockNext)).rejects.toThrow(ZodError);
      expect(getUserById).not.toHaveBeenCalled();
    });

    it("should throw ZodError for empty id", async () => {
      const req = {
        params: { id: "" },
      } as Request<{ id: string }>;
      const res = mockResponse();

      await expect(getUserController(req, res, mockNext)).rejects.toThrow(ZodError);
      expect(getUserById).not.toHaveBeenCalled();
    });
  });

  describe("createUserController", () => {
    const validInput = {
      name: "New User",
      email: "new@example.com",
    };

    it("should create user and return 201", async () => {
      const createdUser = { id: "new-uuid", ...validInput, createdAt: new Date() };
      vi.mocked(createUser).mockResolvedValue(createdUser);

      const req = {
        body: validInput,
      } as Request;
      const res = mockResponse();

      await createUserController(req, res, mockNext);

      expect(createUser).toHaveBeenCalledWith(validInput);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(createdUser);
    });

    it("should throw error when user creation fails", async () => {
      vi.mocked(createUser).mockResolvedValue(null as any);

      const req = {
        body: validInput,
      } as Request;
      const res = mockResponse();

      await expect(createUserController(req, res, mockNext)).rejects.toThrow(
        "User couldn't be created"
      );
    });

    it("should throw ZodError for invalid email", async () => {
      const req = {
        body: { name: "Test", email: "invalid-email" },
      } as Request;
      const res = mockResponse();

      await expect(createUserController(req, res, mockNext)).rejects.toThrow(ZodError);
      expect(createUser).not.toHaveBeenCalled();
    });

    it("should throw ZodError for name too short", async () => {
      const req = {
        body: { name: "A", email: "test@example.com" },
      } as Request;
      const res = mockResponse();

      await expect(createUserController(req, res, mockNext)).rejects.toThrow(ZodError);
      expect(createUser).not.toHaveBeenCalled();
    });

    it("should throw ZodError for missing email", async () => {
      const req = {
        body: { name: "Test User" },
      } as Request;
      const res = mockResponse();

      await expect(createUserController(req, res, mockNext)).rejects.toThrow(ZodError);
      expect(createUser).not.toHaveBeenCalled();
    });

    it("should throw ZodError for missing name", async () => {
      const req = {
        body: { email: "test@example.com" },
      } as Request;
      const res = mockResponse();

      await expect(createUserController(req, res, mockNext)).rejects.toThrow(ZodError);
      expect(createUser).not.toHaveBeenCalled();
    });
  });
});
