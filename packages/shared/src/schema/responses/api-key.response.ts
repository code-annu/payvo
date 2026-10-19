type ApiKeyEnvironment = "LIVE" | "TEST";
type ApiKeyStatus = "ACTIVE" | "GRACE_PERIOD" | "REVOKED";

export interface ApiKeyResponse {
  id: string;
  merchantId: string;
  keyId: string;
  keySecret?: string | null | undefined;
  environment: ApiKeyEnvironment;
  status: ApiKeyStatus;
  graceEndsAt: Date | null;
  revokedAt: Date | null;
  lastUsedAt: Date | null;
  generatedAt: Date;
}

export interface MerchantApiKeysResponse {
  merchantId: string;
  apiKeys: {
    id: string;
    status: ApiKeyStatus;
    keyId: string;
    environment: ApiKeyEnvironment;
    graceEndsAt: Date | null;
    revokedAt: Date | null;
    lastUsedAt: Date | null;
    generatedAt: Date;
  }[];
}
