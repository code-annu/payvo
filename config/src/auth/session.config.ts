import z from "zod";
import { validateEnv } from "../env.js";

const sessionEnvSchema = z.object({
  SESSION_EXPIRY_DAYS: z.coerce.number().int().positive().default(30),
});

const sessionEnv = validateEnv(sessionEnvSchema, "SESSION");

export const sessionConfig = {
  sessionExpiryDays: sessionEnv.SESSION_EXPIRY_DAYS,
};

export type SessionConfig = typeof sessionConfig;
