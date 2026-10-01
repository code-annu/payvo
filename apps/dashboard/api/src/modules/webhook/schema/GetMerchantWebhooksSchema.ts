import { MerchantIdSchema } from "@/modules/merchant/schema/MerchantIdSchema.js";

export const GetMerchantWebhooksSchema = {
  params: MerchantIdSchema,
};