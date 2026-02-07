import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { authMiddleware } from "./auth.js";

vi.mock("jsonwebtoken");

const mockRequest = (authHeader?: string) =>
  ({
    headers: {
      authorization: authHeader,
    },
  }) as Request;

const mockResponse = () => {
  const res = {} as Response;
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
};

const mockNext = vi.fn() as NextFunction;

describe("Auth Middleware", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.JWT_SECRET = "test-secret";
  });

  describe("Missing Authorization", () => {
    it("should return 401 when no authorization header", () => {
      const req = mockRequest();
      const res = mockResponse();

      authMiddleware(req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: "Not authorized" });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe("Invalid Authorization Format", () => {
    it("should return 401 when scheme is not Bearer", () => {
      const req = mockRequest("Basic some-token");
      const res = mockResponse();

      authMiddleware(req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: "Invalid authorization" });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it("should return 401 when token is missing after Bearer", () => {
      const req = mockRequest("Bearer ");
      const res = mockResponse();

      authMiddleware(req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: "Invalid authorization" });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it("should return 401 when only Bearer is provided", () => {
      const req = mockRequest("Bearer");
      const res = mockResponse();

      authMiddleware(req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: "Invalid authorization" });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe("Token Verification", () => {
    it("should call next and set req.user when token is valid", () => {
      const payload = { id: "user-123", email: "test@example.com" };
      vi.mocked(jwt.verify).mockReturnValue(payload as any);

      const req = mockRequest("Bearer valid-token");
      const res = mockResponse();

      authMiddleware(req, res, mockNext);

      expect(jwt.verify).toHaveBeenCalledWith("valid-token", "test-secret");
      expect(req.user).toEqual({ id: "user-123", email: "test@example.com" });
      expect(mockNext).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it("should return 401 when token is expired", () => {
      vi.mocked(jwt.verify).mockImplementation(() => {
        throw new jwt.TokenExpiredError("jwt expired", new Date());
      });

      const req = mockRequest("Bearer expired-token");
      const res = mockResponse();

      authMiddleware(req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: "Invalid or expired token" });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it("should return 401 when token is malformed", () => {
      vi.mocked(jwt.verify).mockImplementation(() => {
        throw new jwt.JsonWebTokenError("jwt malformed");
      });

      const req = mockRequest("Bearer malformed-token");
      const res = mockResponse();

      authMiddleware(req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: "Invalid or expired token" });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it("should return 401 when token signature is invalid", () => {
      vi.mocked(jwt.verify).mockImplementation(() => {
        throw new jwt.JsonWebTokenError("invalid signature");
      });

      const req = mockRequest("Bearer invalid-sig-token");
      const res = mockResponse();

      authMiddleware(req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: "Invalid or expired token" });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });
});
