import z from "zod";
import { validateEnv } from "../env.js";

const serverEnvSchema = z.object({
  PORT: z.coerce.number().int().positive().default(4000),
  NODE_ENV: z.enum(
    ["production", "dev", "test"],
    "NODE_ENV must be one of them ['production','dev','test']",
  ),
  FRONTEND_URL: z
    .string()
    .min(1, "FRONTEND_URL must not be empty")
    .default("http://localhost:5173"),
  FRONTEND_SECRET: z.string().optional(),
});

const serverEnv = validateEnv(serverEnvSchema, "SERVER");

export const serverConfig = {
  port: serverEnv.PORT,
  nodeEnv: serverEnv.NODE_ENV,
  frontendUrl: serverEnv.FRONTEND_URL,
  frontendSecret: serverEnv.FRONTEND_SECRET ?? "frontend_secret",
};

export type ServerConfig = typeof serverConfig;
