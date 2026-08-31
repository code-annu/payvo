import { z } from "zod";

export const signupBodySchema = z.object({
  email: z.email("Valid email is required").trim(),
  password: z
    .string("Password is required")
    .trim()
    .min(8, "Password must be at least 8 characters long")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[0-9]/, "Password must contain at least one number")
    .regex(/[@$!%*?&]/, "Password must contain at least one special character")
    .nonempty("Password cannot be empty"),
  fullname: z
    .string("Fullname is required")
    .trim()
    .nonempty("Full name cannot be empty")
    .min(3, "Full name must be at least 3 characters long")
    .max(50, "Full name must be at most 50 characters long"),
  companyName: z
    .string()
    .trim()
    .max(100, "Company name must be at most 100 characters long")
    .nullish(),
});
