import { MerchantIdSchema } from "@/modules/merchant/schema/MerchantIdParamSchema.js";
import z from "zod";

export const GenerateApiKeySchema = {
  params: MerchantIdSchema,
  body: z.object({
    environment: z.enum(["TEST", "LIVE"], {
      error: "Environment is required. Must be TEST or LIVE",
    }),
  }),
};
