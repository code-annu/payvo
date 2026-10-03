import type { SuccessResponse } from "@/core/api/success.response";

export type ApiKeyEnvironment = "TEST" | "LIVE";

export type ApiKeyStatus = "ACTIVE" | "GRACE_PERIOD" | "REVOKED";

export type OldKeyRevokeStrategy = "IMMEDIATELY" | "24_HOURS";

export interface MerchantApiKey {
  readonly id: string;
  readonly status: ApiKeyStatus;
  readonly environment: ApiKeyEnvironment;
  readonly graceEndsAt: string | null;
  readonly revokedAt: string | null;
  readonly lastUsedAt: string | null;
}

export interface MerchantApiKeysData {
  readonly merchantId: string;
  readonly apiKeys: readonly MerchantApiKey[];
}

export interface ActiveApiKeyData {
  readonly id: string;
  readonly keyId: string;
  readonly status: ApiKeyStatus;
  readonly environment: ApiKeyEnvironment;
  readonly lastUsedAt: string | null;
  readonly generatedAt: string;
}

export interface GenerateApiKeyPayload {
  readonly environment: ApiKeyEnvironment;
}

export interface RotateApiKeyPayload {
  readonly environment: ApiKeyEnvironment;
  readonly oldKeyRevokeStrategy: OldKeyRevokeStrategy;
}

export interface GeneratedApiKeyData {
  readonly id: string;
  readonly keyId: string;
  readonly keySecret: string;
  readonly status: ApiKeyStatus;
  readonly environment: ApiKeyEnvironment;
  readonly generatedAt: string;
}

export type ApiKey = GeneratedApiKeyData & { keySecret?: string };

export interface RevokedApiKeyData {
  readonly id: string;
  readonly keyId: string;
  readonly status: ApiKeyStatus;
  readonly environment: ApiKeyEnvironment;
  readonly revokedAt: string;
}

export type MerchantApiKeysResponse = SuccessResponse<MerchantApiKeysData>;
export type ActiveApiKeyResponse = SuccessResponse<ActiveApiKeyData>;
export type GeneratedApiKeyResponse = SuccessResponse<GeneratedApiKeyData>;
export type RotateApiKeyResponse = SuccessResponse<GeneratedApiKeyData>;
export type RevokeApiKeyResponse = SuccessResponse<RevokedApiKeyData>;
