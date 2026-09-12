export interface RotateApiKeyDto {
  userId: string;
  apiKeyId: string;
  oldKeyRevokeStrategy: OldKeyRevokeStrategy;
}

export type OldKeyRevokeStrategy = "IMMEDIATELY" | "24_HOURS";
