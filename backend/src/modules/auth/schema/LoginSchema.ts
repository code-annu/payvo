import z from "zod";

const LoginBodySchema = z.object({
  email: z
    .email("Please provide a valid email")
    .trim()
    .nonempty("Email cannot be non empty"),
  password: z
    .string("Password is required")
    .trim()
    .nonempty("Password cannot be empty"),
});

export const LoginSchema = {
  body: LoginBodySchema,
};
