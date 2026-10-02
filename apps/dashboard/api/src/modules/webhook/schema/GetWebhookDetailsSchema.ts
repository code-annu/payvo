import { MerchantIdSchema } from "@/modules/merchant/schema/MerchantIdSchema.js";
import { WebhookIdSchema } from "./WebhookIdSchema.js";

export const GetWebhookDetailsSchema = {
  params: MerchantIdSchema.extend({ ...WebhookIdSchema.shape }),
};
