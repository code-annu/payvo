import { WebhookIdSchema } from "./WebhookIdSchema.js";
import z from "zod";

const webhookUrlSchema = z.url().refine((value) => {
  const protocol = new URL(value).protocol;
  return protocol === "http:" || protocol === "https:";
}, "Webhook URL must use HTTP or HTTPS");

export const UpdateWebhookSchema = {
  params: WebhookIdSchema,
  body: z.object({ url: webhookUrlSchema }),
};