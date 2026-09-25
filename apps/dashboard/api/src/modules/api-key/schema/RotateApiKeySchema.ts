import { MerchantIdSchema } from "@/modules/merchant/schema/MerchantIdSchema.js";
import z from "zod";

export const RotateApiKeySchema = {
  params: MerchantIdSchema,
  body: z.object({
    oldKeyRevokeStrategy: z.enum(["IMMEDIATELY", "24_HOURS"], {
      error: "Old key revoke strategy must be either IMMEDIATELY or 24_HOURS",
    }),
    environment: z.enum(["TEST", "LIVE"], {
      error: "Environment must be TEST or LIVE",
    }),
  }),
};
