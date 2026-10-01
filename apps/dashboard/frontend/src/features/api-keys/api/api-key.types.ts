import type { SuccessResponse } from "@/core/api/success.response";

export interface ApiKey {
  readonly id: string;
  readonly keyId: string;
  keySecret?: string | null;
  readonly environment: ApiKeyEnvironment;
  readonly generatedAt: Date;
}

export type ApiKeyEnvironment = "LIVE" | "TEST";
export type OldKeyRevokeStrategy = "IMMEDIATELY" | "24_HOURS";

export interface GenerateApiKeyRequest {
  params: { merchantId: string };
  body: { environment: ApiKeyEnvironment };
}

export interface GetMerchantApiKey {
  params: { merchantId: string };
  query: { environment: ApiKeyEnvironment };
}

export interface RotateApiKeyRequest {
  params: { merchantId: string };
  body: {
    environment: ApiKeyEnvironment;
    oldKeyRevokeStrategy: OldKeyRevokeStrategy;
  };
}

export type ApiKeyResponse = SuccessResponse<{ apiKey: ApiKey }>;

