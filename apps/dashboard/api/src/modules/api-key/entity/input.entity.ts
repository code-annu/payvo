import { Environment } from "./api-key.entity.js";

export interface ApiKeyCreateInput {
  merchantId: string;
  keyId: string;
  secretHash: string;
  environment: Environment;
}

export interface ApiKeyScheduleRevokeInput {
  merchantId: string;
  environment: Environment;
  revokeTime: Date;
}
