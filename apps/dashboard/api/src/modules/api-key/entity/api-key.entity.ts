export interface ApiKey {
  readonly id: string;
  readonly merchantId: string;
  readonly secretHash: string;
  readonly environment: ApiKeyEnvironment;
  readonly status: ApiKeyStatus;
  readonly keyId: string;
  readonly lastUsedAt: Date | null;
  readonly scheduleRevokeAt: Date | null;
  readonly revokedAt: Date | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export type ApiKeyEnvironment = "TEST" | "LIVE";
export type ApiKeyStatus = "ACTIVE" | "REVOKED";
