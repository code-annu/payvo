import { inject, injectable } from "inversify";
import TYPES from "@/core/di/inversify.types";
import ApiKeyRepository from "./repository/api-key.repository";
import ApiKeyUtil from "@/shared/util/api-key.util";
import { ApiKeyCreateDto } from "./dto/ApiKeyCreateDto";
import {
  ApiKeyAlreadyRevokedError,
  ApiKeyNotFoundError,
} from "./api-key.errors";
import {
  MerchantAccessDeniedError,
  MerchantNotFoundError,
} from "@/modules/merchant/merchant.errors";
import { ApiKey } from "./entity/api-key.entity";
import MerchantRepository from "../merchant/repository/merchant.repository";

@injectable()
export default class ApiKeyService {
  constructor(
    @inject(TYPES.ApiKeyRepository)
    private readonly apiKeyRepo: ApiKeyRepository,
    @inject(TYPES.MerchantRepository)
    private readonly merchantRepo: MerchantRepository,
    @inject(TYPES.ApiKeyUtil)
    private readonly apiKeyUtil: ApiKeyUtil,
  ) {}

  async createApiKey(userId: string, merchantId: string, dto: ApiKeyCreateDto) {
    const merchant = await this.merchantRepo.findById(merchantId);
    if (!merchant) {
      throw new MerchantNotFoundError();
    }
    if (merchant.userId !== userId) {
      throw new MerchantAccessDeniedError();
    }

    const rawKey = this.apiKeyUtil.generateApiKey(dto.keyType, dto.environment);
    const keyHash = this.apiKeyUtil.hashApiKey(rawKey);
    const keyPrefix = rawKey.substring(
      0,
      rawKey.indexOf("_", rawKey.indexOf("_") + 1),
    );

    const apiKey = await this.apiKeyRepo.create({
      merchantId,
      keyType: dto.keyType,
      environment: dto.environment,
      keyPrefix,
      keyHash,
    });

    // Return with the plaintext key value — this is the only time it's available
    return { apiKey: { ...apiKey, keyValue: rawKey } as ApiKey };
  }

  async getApiKey(userId: string, apiKeyId: string) {
    const apiKey = await this.apiKeyRepo.findById(apiKeyId);
    if (!apiKey) {
      throw new ApiKeyNotFoundError();
    }

    const merchant = await this.merchantRepo.findById(apiKey.merchantId);
    if (!merchant) {
      throw new MerchantNotFoundError();
    }
    if (merchant.userId !== userId) {
      throw new MerchantAccessDeniedError();
    }

    return { apiKey };
  }

  async getMerchantApiKeys(userId: string, merchantId: string) {
    const merchant = await this.merchantRepo.findById(merchantId);
    if (!merchant) {
      throw new MerchantNotFoundError();
    }
    if (merchant.userId !== userId) {
      throw new MerchantAccessDeniedError();
    }

    const apiKeys = await this.apiKeyRepo.findByMerchantId(merchantId);
    return { merchantId, apiKeys };
  }

  async revokeApiKey(userId: string, apiKeyId: string) {
    const apiKey = await this.apiKeyRepo.findById(apiKeyId);
    if (!apiKey) {
      throw new ApiKeyNotFoundError();
    }

    const merchant = await this.merchantRepo.findById(apiKey.merchantId);
    if (!merchant) {
      throw new MerchantNotFoundError();
    }
    if (merchant.userId !== userId) {
      throw new MerchantAccessDeniedError();
    }

    if (apiKey.revokedAt || !apiKey.isActive) {
      throw new ApiKeyAlreadyRevokedError();
    }

    const revokedKey = await this.apiKeyRepo.revoke(apiKeyId);
    return { apiKey: revokedKey };
  }

  async deleteApiKey(userId: string, apiKeyId: string) {
    const apiKey = await this.apiKeyRepo.findById(apiKeyId);
    if (!apiKey) {
      throw new ApiKeyNotFoundError();
    }

    const merchant = await this.merchantRepo.findById(apiKey.merchantId);
    if (!merchant) {
      throw new MerchantNotFoundError();
    }
    if (merchant.userId !== userId) {
      throw new MerchantAccessDeniedError();
    }

    await this.apiKeyRepo.delete(apiKeyId);
  }
}
