export type ApiKeyType = "SECRET" | "PUBLISHABLE";
export type ApiKeyEnvironment = "TEST" | "LIVE";

export interface ApiKey {
  readonly id: string;
  readonly merchantId: string;
  readonly keyType: ApiKeyType;
  readonly keyPrefix: string;
  readonly keyValue?: string | null;
  readonly keyHash: string;
  readonly isActive: boolean;
  readonly environment: ApiKeyEnvironment;
  readonly lastUsedAt: Date | null;
  readonly revokedAt: Date | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}
