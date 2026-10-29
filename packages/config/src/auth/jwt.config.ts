import z from "zod";
import { validateEnv } from "../env.js";

const jwtEnvSchema = z
  .object({
    JWT_ACCESS_SECRET: z
      .string()
      .min(32, "JWT_ACCESS_SECRET must be at least 32 characters long")
      .optional(),
    ACCESS_TOKEN_SECRET: z
      .string()
      .min(32, "ACCESS_TOKEN_SECRET must be at least 32 characters long")
      .optional(),
    JWT_EXPIRES_IN_MIN: z.coerce.number().int().positive().optional(),
    ACCESS_TOKEN_EXPIRY_MIN: z.coerce.number().int().positive().optional(),
  })
  .refine(
    (data) => Boolean(data.JWT_ACCESS_SECRET || data.ACCESS_TOKEN_SECRET),
    {
      message:
        "JWT_ACCESS_SECRET or ACCESS_TOKEN_SECRET must be provided and at least 32 characters long",
      path: ["JWT_ACCESS_SECRET"],
    },
  );

const jwtEnv = validateEnv(jwtEnvSchema, "JWT");

const accessSecret = (jwtEnv.JWT_ACCESS_SECRET ?? jwtEnv.ACCESS_TOKEN_SECRET)!;
const expiresInMin =
  jwtEnv.JWT_EXPIRES_IN_MIN ?? jwtEnv.ACCESS_TOKEN_EXPIRY_MIN ?? 15;

export const jwtConfig = {
  accessSecret,
  EXPIRES_IN_MIN: expiresInMin,
  accessToken: {
    secret: accessSecret,
    expiryMinutes: expiresInMin,
  },
};

export type JwtConfig = typeof jwtConfig;
