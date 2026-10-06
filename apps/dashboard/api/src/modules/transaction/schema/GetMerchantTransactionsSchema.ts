import { MerchantIdSchema } from "@/modules/merchant/schema/MerchantIdSchema.js";

export const GetMerchantTransactionsSchema = {
  params: MerchantIdSchema,
};
