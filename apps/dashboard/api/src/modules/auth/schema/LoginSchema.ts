import z from "zod";

export const loginBodySchema = z.object({
  email: z.email("Valid email is required").trim(),
  password: z
    .string("Password is required")
    .trim()
    .nonempty("Password cannot be empty"),
});
