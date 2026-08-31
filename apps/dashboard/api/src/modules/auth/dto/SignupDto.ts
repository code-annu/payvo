import z from "zod";
import { signupBodySchema } from "../schema/SignupSchema.js";

export type SignupDto = z.infer<typeof signupBodySchema> & {
  userAgent?: string | null | undefined;
  ipAddress?: string | null | undefined;
};
