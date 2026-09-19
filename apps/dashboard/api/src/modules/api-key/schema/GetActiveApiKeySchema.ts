import { MerchantIdSchema } from "@/modules/merchant/schema/MerchantIdSchema.js";
import z from "zod";

export const GetActiveApiKeySchema = {
  params: MerchantIdSchema,
  query: z.object({
    environment: z.enum(["TEST", "LIVE"], {
      error: "Environment must be TEST or LIVE",
    }),
  }),
};
