import z from "zod";
import { EmailSchema, PasswordSchema } from "../fields/user.fields.js";

export const SignupSchema = {
  body: z.object({
    email: EmailSchema.nonempty("Email cannot be empty"),
    password: PasswordSchema.nonempty("Password cannot be empty"),
  }),
};

export type SignupRequest = z.infer<typeof SignupSchema.body>;

export const LoginSchema = {
  body: z.object({
    email: EmailSchema.nonempty("Email cannot be empty"),
    password: z
      .string("Password is must be a string")
      .trim()
      .nonempty("Password cannot be empty"),
  }),
};

export type LoginRequest = z.infer<typeof LoginSchema.body>;

export const RefreshTokenSchema = {
  cookies: z.object({
    refreshToken: z
      .string("Refresh token is required")
      .trim()
      .nonempty("Refresh token cannot be empty"),
  }),
};
