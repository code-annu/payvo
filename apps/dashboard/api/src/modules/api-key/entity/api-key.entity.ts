export interface ApiKey {
  readonly id: string;
  readonly keyId: string;
  readonly secretHash: string;
  readonly environment: ApiKeyEnvironment;
  readonly status: ApiKeyStatus;
  readonly graceEndsAt: Date | null;
  readonly revokedAt: Date | null;
  readonly lastUsedAt: Date | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly merchant: {
    readonly id: string;
    readonly isActive: boolean;
    readonly userId: string;
  };
}

export type ApiKeyEnvironment = "TEST" | "LIVE";
export type ApiKeyStatus = "ACTIVE" | "REVOKED" | "GRACE_PERIOD";
