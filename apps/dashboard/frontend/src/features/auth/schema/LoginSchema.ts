import { z } from "zod";
import type { LoginRequest } from "../api/auth.types";

/**
 * Zod validation schema for user login based on LoginRequest.
 */
export const loginSchema = z.object({
  email: z.email("Please enter a valid email address"),
  password: z.string("Password is required"),
});

export type LoginFormData = z.infer<typeof loginSchema>;
export type LoginFormValues = LoginFormData;

// Compile-time type assertion to guarantee LoginFormData satisfies LoginRequest
type _AssertLogin = LoginFormData extends LoginRequest ? true : false;
const _typeCheck: _AssertLogin = true;
void _typeCheck;

export const LoginSchema = loginSchema;
export default loginSchema;
