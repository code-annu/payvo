import type {
  ApiKeyEnvironment,
  ApiKeyStatus,
} from "../../entity/api-key.entity.js";

export interface ListMerchantApiKeysInputDto {
  userId: string;
  merchantId: string;
}

export interface ListMerchantApiKeysOutputDto {
  merchantId: string;
  apiKeys: {
    id: string;
    status: ApiKeyStatus;
    environment: ApiKeyEnvironment;
    graceEndsAt: Date | null;
    revokedAt: Date | null;
    lastUsedAt: Date | null;
  }[];
}
