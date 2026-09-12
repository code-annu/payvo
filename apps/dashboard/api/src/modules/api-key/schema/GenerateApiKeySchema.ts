import { MerchantIdSchema } from "@/modules/merchant/schema/MerchantIdSchema.js";
import z from "zod";

export const CreateApiKeySchema = {
  params: MerchantIdSchema,
  body: z.object({
    environment: z.enum(["TEST", "LIVE"], {
      error: "Environment must be TEST or LIVE",
    }),
  }),
};
