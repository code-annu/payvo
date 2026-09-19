import { ApiKeyEnvironment } from "../../entity/api-key.entity.js";

export interface GenerateApiKeyDto {
  merchantId: string;
  environment: ApiKeyEnvironment;
  userId: string;
}
