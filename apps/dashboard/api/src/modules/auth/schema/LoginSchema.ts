import z from "zod";

export const LoginSchema = {
  body: z.object({
    email: z.email("Valid email is required"),
    password: z.string("Password is required"),
  }),
};
