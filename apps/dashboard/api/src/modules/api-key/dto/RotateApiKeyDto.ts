import { ApiKeyEnvironment } from "../entity/api-key.entity.js";

export interface RotateApiKeyDto {
  userId: string;
  merchantId: string;
  oldKeyRevokeStrategy: OldKeyRevokeStrategy;
  environment: ApiKeyEnvironment;
}

export type OldKeyRevokeStrategy = "IMMEDIATELY" | "24_HOURS";
