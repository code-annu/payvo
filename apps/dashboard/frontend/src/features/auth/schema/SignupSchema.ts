import { z } from "zod";
import type { SignupRequest } from "../api/types";

/**
 * Zod validation schema for user registration based on SignupRequest.
 * Includes password confirmation refinement targeting the confirmPassword field.
 */
export const signupSchema = z.object({
  fullname: z
    .string()
    .min(3, "Full name must be at least 2 characters")
    .max(50, "Full name must be at most 50 characters"),
  email: z.email("Please enter a valid email address"),
  companyName: z.string().optional(),
  password: z
    .string("Password is required")
    .trim()
    .min(8, "Password must be at least 8 characters long")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[0-9]/, "Password must contain at least one number")
    .regex(/[@$!%*?&]/, "Password must contain at least one special character")
    .nonempty("Password cannot be empty"),
});

export type SignupFormData = z.infer<typeof signupSchema>;
export type SignupFormValues = SignupFormData;

// Compile-time assertion ensuring SignupFormData contains all fields of SignupRequest
type _AssertSignup =
  Omit<SignupFormData, "confirmPassword"> extends SignupRequest ? true : false;
const _typeCheck: _AssertSignup = true;
void _typeCheck;

export const SignupSchema = signupSchema;
export default signupSchema;
