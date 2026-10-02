import { MerchantIdSchema } from "@/modules/merchant/schema/MerchantIdSchema.js";
import { ApiKeyIdSchema } from "./ApiKeyIdSchema.js";

export const RevokeApiKeySchema = {
  params: MerchantIdSchema.extend(ApiKeyIdSchema.shape),
};
