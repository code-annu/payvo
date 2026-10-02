import { MerchantIdSchema } from "@/modules/merchant/schema/MerchantIdSchema.js";

export const ListMerchantApiKeysSchema = {
  params: MerchantIdSchema,
};
