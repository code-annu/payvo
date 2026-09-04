import { z } from "zod";
import type { LoginRequest } from "../api/user.types";

/**
 * Zod validation schema for user login based on LoginRequest.
 */
export const loginSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Please enter a valid email address"),
  password: z
    .string()
    .min(1, "Password is required")
    .min(6, "Password must be at least 6 characters"),
});

export type LoginFormData = z.infer<typeof loginSchema>;
export type LoginFormValues = LoginFormData;

// Compile-time type assertion to guarantee LoginFormData satisfies LoginRequest
type _AssertLogin = LoginFormData extends LoginRequest ? true : false;
const _typeCheck: _AssertLogin = true;
void _typeCheck;

export const LoginSchema = loginSchema;
export default loginSchema;
