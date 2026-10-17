import z from "zod";
import { validateEnv } from "../env.js";

const databaseEnvSchema = z.object({
  DATABASE_URL: z.string().min(1, "DATABASE_URL must not be empty"),
});

const databaseEnv = validateEnv(databaseEnvSchema, "DATABASE");

export const databaseConfig = {
  url: databaseEnv.DATABASE_URL,
};

export type DatabaseConfig = typeof databaseConfig;
