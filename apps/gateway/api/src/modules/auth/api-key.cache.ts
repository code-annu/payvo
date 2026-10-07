import { inject, injectable } from "inversify";
import ApiKeyRepository from "./repository/api-key.repository.js";
import TYPES from "@/core/di/inversify.types.js";
import { ApiKeyEnvironment, ApiKeyStatus } from "./entity/api-key.entity.js";
import { getCache, setCache } from "@payvo/redis/cache";

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

  async getCachedApiKey(apiKeyId: string): Promise<CachedApiKey | null> {
    let key = await getCache<CachedApiKey | null>(apiKeyKey(apiKeyId));
    if (!key) {
      const apiKey = await this.apiKeyRepo.findByKeyId(apiKeyId);
      if (!apiKey) return null;

      key = {
        id: apiKey.id,
        merchantId: apiKey.merchantId,
        keyId: apiKey.keyId,
        secretHash: apiKey.secretHash,
        environment: apiKey.environment,
        status: apiKey.status,
        graceEndsAt: apiKey.graceEndsAt,
        revokedAt: apiKey.revokedAt,
      };
      setCache<CachedApiKey>({
        key: apiKeyKey(apiKeyId),
        value: key,
        ttlSeconds: 5 * 60,
      });
    }
    return key;
  }
}
