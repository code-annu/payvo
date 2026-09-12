import z from "zod";
import { ApiKeyIdSchema } from "./ApiKeyIdSchema.js";

export const RotateMerchantApiKeySchema = {
  params: ApiKeyIdSchema,
  body: z.object({
    oldKeyRevokeStrategy: z.enum(["IMMEDIATELY", "24_HOURS"], {
      error: "Old key revoke strategy must be either IMMEDIATELY or 24_HOURS",
    }),
  }),
};
