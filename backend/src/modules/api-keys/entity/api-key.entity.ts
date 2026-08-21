export type ApiKeyType = "SECRET" | "PUBLISHABLE";
export type ApiKeyEnvironment = "TEST" | "LIVE";

export interface ApiKey {
  readonly id: string;
  readonly keyType: ApiKeyType;
  readonly keyPrefix: string;
  readonly isActive: boolean;
  readonly environment: ApiKeyEnvironment;
  readonly lastUsedAt: Date | null;
  readonly revokedAt: Date | null;
  readonly createdAt: Date;
}
