import { ApiKeyEnvironment } from "../entity/api-key.entity.js";

export interface GetMerchantActiveApiKeyDto {
  userId: string;
  merchantId: string;
  environment: ApiKeyEnvironment;
}
