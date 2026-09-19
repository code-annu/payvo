import { ApiKeyEnvironment } from "../../entity/api-key.entity.js";

export interface GetActiveApiKeyDto {
  merchantId: string;
  environment: ApiKeyEnvironment;
  userId: string;
}
