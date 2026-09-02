import { MerchantIdSchema } from "@/modules/merchant/schema/MerchantIdParamSchema.js";
import z from "zod";

export const RotateMerchantApiKeySchema = {
  params: MerchantIdSchema,
  body: z.object({
    environment: z.enum(["TEST", "LIVE"], {
      error: "Environment must be either TEST or LIVE",
    }),
    oldKeyRevokeStrategy: z.enum(["IMMEDIATELY", "24_HOURS"], {
      error: "Old key revoke strategy must be either IMMEDIATELY or 24_HOURS",
    }),
  }),
};
