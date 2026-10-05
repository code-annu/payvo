import type { ApiKeyEnvironment } from "../../entity/api-key.entity.js";

export interface ValidateApiKeyInputDto {
  keyId: string;
  keySecret: string;
}

export interface ValidateApiKeyOutputDto {
  valid: boolean;
  merchantId: string;
  environment: ApiKeyEnvironment;
}
