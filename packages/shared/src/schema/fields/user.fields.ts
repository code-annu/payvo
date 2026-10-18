import z from "zod";

export const EmailSchema = z
  .email("Must be a valid email address")
  .trim()
  .toLowerCase();

export const PasswordSchema = z
  .string("Must be a string")
  .trim()
  .min(8, "Password must be at least 8 characters long")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  .regex(/[0-9]/, "Password must contain at least one number")
  .regex(/[@$!%*?&#]/, "Password must contain at least one special character")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter");
