import { MerchantIdSchema } from "@/modules/merchant/schema/MerchantIdSchema.js";
import z from "zod";

const webhookUrlSchema = z.url().refine((value) => {
  const protocol = new URL(value).protocol;
  return protocol === "http:" || protocol === "https:";
}, "Webhook URL must use HTTP or HTTPS");

export const CreateWebhookSchema = {
  params: MerchantIdSchema,
  body: z.object({ url: webhookUrlSchema }),
};