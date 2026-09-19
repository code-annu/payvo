import z from "zod";

export const ApiKeyIdSchema = z.object({
  apiKeyId: z.uuid("Api-key id must be a valid uuid"),
});
