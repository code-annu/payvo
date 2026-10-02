import { MerchantIdSchema } from "@/modules/merchant/schema/MerchantIdSchema.js";
import { WebhookIdSchema } from "./WebhookIdSchema.js";

export const DeleteWebhookSchema = {
  params: MerchantIdSchema.extend({ ...WebhookIdSchema.shape }),
};
