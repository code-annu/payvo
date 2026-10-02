import { MerchantIdSchema } from "@/modules/merchant/schema/MerchantIdSchema.js";
import z from "zod";

export const CreateWebhookSchema = {
  params: MerchantIdSchema,
  body: z.object({ url: z.url("Valid url is required") }),
};
