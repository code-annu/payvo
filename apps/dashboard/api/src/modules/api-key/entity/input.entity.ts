import { ApiKeyEnvironment } from "./api-key.entity.js";

export interface ApiKeyCreateInput {
  merchantId: string;
  keyId: string;
  secretHash: string;
  environment: ApiKeyEnvironment;
}

export interface ApiKeyScheduleRevokeInput {
  merchantId: string;
  environment: ApiKeyEnvironment;
  revokeTime: Date;
}
