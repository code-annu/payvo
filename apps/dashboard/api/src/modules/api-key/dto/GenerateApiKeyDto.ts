import { Environment } from "../entity/api-key.entity.js";

export interface GenerateApiKeyDto {
  userId: string;
  merchantId: string;
  environment: Environment;
}
