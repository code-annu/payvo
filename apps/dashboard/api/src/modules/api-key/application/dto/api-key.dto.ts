import z from "zod";
import {
  GenerateApiKeySchema,
  GetActiveApiKeySchema,
  ListMerchantApiKeysSchema,
  RotateApiKeySchema,
} from "../../schema/api-key.schema.js";
import { ApiKeyEnvironment, ApiKeyStatus } from "@payvo/database/types";

export type OldKeyRevokeStrategy = "IMMEDIATELY" | "24_HOURS";

export type GenerateApiKeyInputDto = z.infer<typeof GenerateApiKeySchema.body> &
  z.infer<typeof GenerateApiKeySchema.params>;

export type GetActiveApiKeyInputDto = z.infer<
  typeof GetActiveApiKeySchema.params
> &
  z.infer<typeof GetActiveApiKeySchema.query>;

export type ListMerchantApiKeysInputDto = z.infer<
  typeof ListMerchantApiKeysSchema.params
> & { userId: string };

export type RotateApiKeyInputDto = z.infer<typeof RotateApiKeySchema.body> &
  z.infer<typeof RotateApiKeySchema.params> & { userId: string };

export interface ApiKeyOutputDto {
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

export interface MerchantApiKeysOutputDto {
  merchantId: string;
  apiKeys: {
    id: string;
    status: ApiKeyStatus;
    environment: ApiKeyEnvironment;
    graceEndsAt: Date | null;
    revokedAt: Date | null;
    lastUsedAt: Date | null;
    generatedAt: Date;
  }[];
}
