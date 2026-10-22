import type { ApiKey } from "@payvo/database/types";
import { injectable } from "inversify";
import {
  ApiKeyResponse,
  MerchantApiKeysResponse,
} from "@payvo/shared/schema/responses";

@injectable()
export default class ApiKeyMapper {
  mapToApiKeyResponse(apiKey: ApiKey, keySecret?: string): ApiKeyResponse {
    return {
      id: apiKey.id,
      merchantId: apiKey.merchantId,
      keyId: apiKey.keyId,
      keySecret,
      environment: apiKey.environment,
      status: apiKey.status,
      graceEndsAt: apiKey.graceEndsAt,
      revokedAt: apiKey.revokedAt,
      lastUsedAt: apiKey.lastUsedAt,
      generatedAt: apiKey.createdAt,
    };
  }

  mapToMerchantApiKeysResponse(
    merchantId: string,
    apiKeys: ApiKey[],
  ): MerchantApiKeysResponse {
    return {
      merchantId,
      apiKeys: apiKeys.map((apiKey) => ({
        id: apiKey.id,
        status: apiKey.status,
        keyId: apiKey.keyId,
        environment: apiKey.environment,
        graceEndsAt: apiKey.graceEndsAt,
        revokedAt: apiKey.revokedAt,
        lastUsedAt: apiKey.lastUsedAt,
        generatedAt: apiKey.createdAt,
      })),
    };
  }
}
