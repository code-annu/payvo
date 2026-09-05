import { ApiKeyEnvironment } from "../entity/api-key.entity.js";

export interface RotateMerchantApiKeyDto {
  userId: string;
  merchantId: string;
  environment: ApiKeyEnvironment;
  oldKeyRevokeStrategy: OldKeyRevokeStrategy;
}

type OldKeyRevokeStrategy = "IMMEDIATELY" | "24_HOURS";
