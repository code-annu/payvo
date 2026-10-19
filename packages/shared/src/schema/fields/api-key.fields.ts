import z from "zod";

export const ApiKeyKeyIdSchema = z.string("Api key id must be a string").trim();

export const ApiKeySecretHashSchema = z.string(
  "Api key secret hash must be a string",
);

export const ApiKeyEnvironmentSchema = z.enum(
  ["TEST", "LIVE"],
  "Api key environment must be either 'TEST' or 'LIVE'",
);
