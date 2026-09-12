import { ApiKeyEnvironment } from "../entity/api-key.entity.js";

export interface GetActiveApiKeyDto {
  merchantId: string;
  userId: string;
  environment: ApiKeyEnvironment;
}
