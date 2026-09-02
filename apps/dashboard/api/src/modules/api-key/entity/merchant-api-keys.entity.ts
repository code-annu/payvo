import { ApiKeyStatus, Environment } from "./api-key.entity.js";

export interface MerchantApiKeys {
  readonly merchantId: string;
  readonly apiKeys: {
    readonly id: string;
    readonly secretHash: string;
    readonly environment: Environment;
    readonly status: ApiKeyStatus;
    readonly keyId: string;
    readonly lastUsedAt: Date | null;
    readonly revokedAt: Date | null;
    readonly deactivatedAt: Date | null;
    readonly createdAt: Date;
    readonly updatedAt: Date;
  }[];
}
