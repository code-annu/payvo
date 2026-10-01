import z from "zod";

export const WebhookIdSchema = z.object({
  webhookId: z.uuid("Webhook id must be a valid uuid"),
});