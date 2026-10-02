import { MerchantIdSchema } from "@/modules/merchant/schema/MerchantIdSchema.js";
import { WebhookIdSchema } from "./WebhookIdSchema.js";
import z from "zod";

export const UpdateWebhookSchema = {
  params: MerchantIdSchema.extend({ ...WebhookIdSchema.shape }),

  body: z.object({ url: z.url("Not a valid url").optional() }),
};
