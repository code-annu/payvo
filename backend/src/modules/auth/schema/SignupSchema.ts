import z from "zod";
const SignupBodySchema = z.object({
  fullname: z
    .string("Full name is required")
    .trim()
    .nonempty("Full name cannot be empty")
    .min(3, "Full name must be at least 3 characters long")
    .max(100, "Full name must be at most 100 characters"),
  companyName: z
    .string()
    .trim()
    .max(100, "Company name must be at most 100 characters")
    .nullish(),
  email: z
    .email("Please provide a valid email")
    .trim()
    .nonempty("Email cannot be non empty")
    .max(255, "Email must be at most 255 characters"),
  password: z
    .string("Password is required")
    .min(8, "Password must be at least 8 characters long")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[0-9]/, "Password must contain at least one number")
    .regex(/[@$!%*?&]/, "Password must contain at least one special character")
    .trim()
    .nonempty("Password cannot be empty"),
});

export const SignupSchema = {
  body: SignupBodySchema,
};
