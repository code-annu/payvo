import { inject, injectable } from "inversify";
import ApiKeyRepository from "./repository/api-key.repository.js";
import TYPES from "@/core/di/inversify.types.js";
import { ApiKeyEnvironment, ApiKeyStatus } from "./entity/api-key.entity.js";
import { deleteCache } from "@payvo/redis/cache";

const apiKeyKey = (id: string) => `api-key:cache:${id}`;

interface CachedApiKey {
  readonly id: string;
  readonly merchantId: string;
  readonly keyId: string;
  readonly secretHash: string;
  readonly environment: ApiKeyEnvironment;
  readonly status: ApiKeyStatus;
  readonly graceEndsAt: Date | null;
  readonly revokedAt: Date | null;
}

@injectable()
export default class ApiKeyCache {
  constructor(
    @inject(TYPES.ApiKeyRepository)
    private readonly apiKeyRepo: ApiKeyRepository,
  ) {}

  async invalidateApiKeyCache(apiKeyId: string): Promise<void> {
    return deleteCache(apiKeyKey(apiKeyId));
  }

  async invalidateAllApiKeysCacheByMerchantId(
    merchantId: string,
  ): Promise<void> {
    const apiKeys = await this.apiKeyRepo.findByMerchantId(merchantId);
    await Promise.all(
      apiKeys.map((apiKey) => this.invalidateApiKeyCache(apiKey.id)),
    );
  }
}
