import { describe, it, expect, vi, beforeEach } from "vitest";
import { getUserById, createUser } from "./user.service.js";

vi.mock("../../../../db/prisma.js", () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      upsert: vi.fn(),
    },
  },
}));

import { prisma } from "../../../../db/prisma.js";

const mockUser = {
  id: "550e8400-e29b-41d4-a716-446655440000",
  email: "test@example.com",
  name: "Test User",
  createdAt: new Date("2024-01-01"),
};

describe("User Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getUserById", () => {
    it("should return user when found", async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser);

      const result = await getUserById(mockUser.id);

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: mockUser.id },
      });
      expect(result).toEqual(mockUser);
    });

    it("should return null when user not found", async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

      const result = await getUserById("non-existent-id");

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: "non-existent-id" },
      });
      expect(result).toBeNull();
    });

    it("should throw when database error occurs", async () => {
      vi.mocked(prisma.user.findUnique).mockRejectedValue(
        new Error("Database connection failed")
      );

      await expect(getUserById(mockUser.id)).rejects.toThrow(
        "Database connection failed"
      );
    });
  });

  describe("createUser", () => {
    const userData = {
      name: "New User",
      email: "new@example.com",
    };

    it("should create a new user when email does not exist", async () => {
      const createdUser = {
        id: "new-uuid",
        ...userData,
        createdAt: new Date(),
      };
      vi.mocked(prisma.user.upsert).mockResolvedValue(createdUser);

      const result = await createUser(userData);

      expect(prisma.user.upsert).toHaveBeenCalledWith({
        where: { email: userData.email },
        update: {},
        create: { name: userData.name, email: userData.email },
      });
      expect(result).toEqual(createdUser);
    });

    it("should return existing user when email already exists", async () => {
      const existingUser = {
        id: "existing-uuid",
        ...userData,
        createdAt: new Date("2024-01-01"),
      };
      vi.mocked(prisma.user.upsert).mockResolvedValue(existingUser);

      const result = await createUser(userData);

      expect(prisma.user.upsert).toHaveBeenCalledWith({
        where: { email: userData.email },
        update: {},
        create: { name: userData.name, email: userData.email },
      });
      expect(result).toEqual(existingUser);
    });

    it("should throw when database error occurs", async () => {
      vi.mocked(prisma.user.upsert).mockRejectedValue(
        new Error("Unique constraint violation")
      );

      await expect(createUser(userData)).rejects.toThrow(
        "Unique constraint violation"
      );
    });
  });
});
