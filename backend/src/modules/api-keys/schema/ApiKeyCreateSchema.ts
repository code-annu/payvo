import z from "zod";

const ApiKeyCreateBodySchema = z.object({
  keyType: z
    .enum(["SECRET", "PUBLISHABLE"] as const)
    .describe("Key type is required"),
  environment: z
    .enum(["TEST", "LIVE"] as const)
    .describe("Environment is required"),
});

export const ApiKeyCreateSchema = {
  body: ApiKeyCreateBodySchema,
};
