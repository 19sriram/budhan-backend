import z from "zod";

export const getUserSchema = z.object({
  id: z.string().uuid({ version: "v4" }),
});

export const createUserSchema = z.object({
  name: z
    .string()
    .min(2, { message: "Name must be at least 2 characters long" }),
  email: z.email({
    message: "Enter valid email address",
  }),
});
