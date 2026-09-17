import TYPES from "@/core/di/inversify.types.js";
import { inject, injectable } from "inversify";
import ApiKeyRepository from "./repository/api-key.repository.js";
import { GenerateApiKeyDto } from "./dto/GenerateApiKeyDto.js";
import { GetActiveApiKeyDto } from "./dto/GetActiveApiKeyDto.js";
import { RotateApiKeyDto } from "./dto/RotateApiKeyDto.js";
import {
  MerchantInactiveError,
  MerchantNotFoundError,
} from "../merchant/error/merchant.errors.js";
import {
  ApiKeyAlreadyExistsError,
  ApiKeyNotFoundError,
} from "./error/api-key.errors.js";
import { generateApiKey, hashKeySecret } from "@payvo/shared/api-key";
import { dbTransaction } from "@payvo/database/client";
import { addHours } from "date-fns";
import MerchantCacheService, {
  CachedMerchant,
} from "../merchant/merchant-cache.service.js";

@injectable()
export default class ApiKeyService {
  constructor(
    @inject(TYPES.ApiKeyRepository)
    private readonly apiKeyRepo: ApiKeyRepository,
    @inject(TYPES.MerchantCacheService)
    private readonly merchantCacheService: MerchantCacheService,
  ) {}

  private async findActiveMerchantOrThrow(
    userId: string,
    merchantId: string,
  ): Promise<CachedMerchant> {
    const merchant =
      await this.merchantCacheService.getCachedMerchant(merchantId);
    if (!merchant || merchant.userId !== userId)
      throw new MerchantNotFoundError();
    if (!merchant.isActive) {
      throw new MerchantInactiveError(
        "Inactive merchant cannot perform api key operations",
      );
    }
    return merchant;
  }

  async generateMerchantApiKey(input: GenerateApiKeyDto) {
    const { userId, merchantId, environment } = input;
    await this.findActiveMerchantOrThrow(userId, merchantId);

    const activeKey = await this.apiKeyRepo.findActiveKey({
      merchantId,
      environment,
    });
    if (activeKey) {
      throw new ApiKeyAlreadyExistsError(
        "Active api key already exists for this merchant and environment",
      );
    }
    const { keyId, keySecret } = generateApiKey(environment);
    const secretHash = hashKeySecret(keySecret);
    const apiKey = await this.apiKeyRepo.create({
      merchantId,
      keyId,
      secretHash,
      environment,
    });

    return {
      id: apiKey.id,
      keyId,
      keySecret,
      status: apiKey.status,
      environment: apiKey.environment,
      generatedAt: apiKey.createdAt,
    };
  }

  async getActiveApiKey(input: GetActiveApiKeyDto) {
    const { userId, merchantId, environment } = input;
    await this.findActiveMerchantOrThrow(userId, merchantId);

    const apiKey = await this.apiKeyRepo.findActiveKey({
      merchantId,
      environment,
    });
    if (!apiKey) {
      throw new ApiKeyNotFoundError(
        "No active api key found for this merchant and environment",
      );
    }

    return {
      id: apiKey.id,
      keyId: apiKey.keyId,
      status: apiKey.status,
      environment: apiKey.environment,
      lastUsedAt: apiKey.lastUsedAt,
      createdAt: apiKey.createdAt,
    };
  }

  async rotateApiKey(input: RotateApiKeyDto) {
    const { userId, merchantId, oldKeyRevokeStrategy, environment } = input;

    await this.findActiveMerchantOrThrow(userId, merchantId);

    const revokeAt =
      oldKeyRevokeStrategy === "IMMEDIATELY"
        ? new Date()
        : addHours(new Date(), 24);

    const { keyId, keySecret } = generateApiKey(environment);
    const secretHash = hashKeySecret(keySecret);

    const newKey = await dbTransaction(async (tx) => {
      const revokedKey = await this.apiKeyRepo.revokeKeyForRotation(tx, {
        merchantId,
        revokeAt,
      });
      if (!revokedKey) throw new ApiKeyNotFoundError();

      return this.apiKeyRepo.create(
        { merchantId, keyId, secretHash, environment },
        tx,
      );
    });

    return {
      id: newKey.id,
      keyId,
      keySecret,
      status: newKey.status,
      environment: newKey.environment,
      generatedAt: newKey.createdAt,
    };
  }
}
