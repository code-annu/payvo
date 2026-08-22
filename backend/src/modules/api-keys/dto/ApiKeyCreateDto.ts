import { ApiKeyEnvironment, ApiKeyType } from "../entity/api-key.entity";

export interface ApiKeyCreateDto {
  keyType: ApiKeyType;
  environment: ApiKeyEnvironment;
}
