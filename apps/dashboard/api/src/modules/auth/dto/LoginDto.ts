import z from "zod";
import { loginBodySchema } from "../schema/LoginSchema.js";

export type LoginDto = z.infer<typeof loginBodySchema> & {
  userAgent?: string | null | undefined;
  ipAddress?: string | null | undefined;
};

