import { ClientInfoType } from "@payvo/http/client";
import { EmailSchema, PasswordSchema } from "@payvo/shared/schema";
import z from "zod";

export const SignupSchema = {
  body: z.object({
    email: EmailSchema.nonempty("Email cannot be empty"),
    password: PasswordSchema.nonempty("Password cannot be empty"),
  }),
};

export type SignupInput = z.infer<typeof SignupSchema.body> & {
  client: ClientInfoType;
};

export const LoginSchema = {
  body: z.object({
    email: EmailSchema.nonempty("Email cannot be empty"),
    password: z
      .string("Password is must be a string")
      .trim()
      .nonempty("Password cannot be empty"),
  }),
};

export type LoginInput = z.infer<typeof LoginSchema.body> & {
  client: ClientInfoType;
};

export const RefreshTokenSchema = {
  cookies: z.object({
    refreshToken: z
      .string("Refresh token is required")
      .trim()
      .nonempty("Refresh token cannot be empty"),
  }),
};
