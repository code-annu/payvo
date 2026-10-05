import { z } from "zod";
import type { CreateWebhookPayload } from "../api/webhook.types";

/**
 * Zod validation schema for creating a webhook based on CreateWebhookPayload.
 */
export const createWebhookSchema = z.object({
  url: z.url("Please enter a valid URL (e.g., https://example.com/webhooks)"),
});

export type CreateWebhookFormData = z.infer<typeof createWebhookSchema>;
export type CreateWebhookFormValues = CreateWebhookFormData;

// Compile-time type assertion to guarantee CreateWebhookFormData satisfies CreateWebhookPayload
type _AssertCreateWebhook = CreateWebhookFormData extends CreateWebhookPayload
  ? true
  : false;
const _typeCheck: _AssertCreateWebhook = true;
void _typeCheck;

export const CreateWebhookSchema = createWebhookSchema;
export default createWebhookSchema;
