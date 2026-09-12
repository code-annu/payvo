import TYPES from "@/core/di/inversify.types.js";
import { inject, injectable } from "inversify";
import ApiKeyRepository from "./repository/api-key.repository.js";
import { GenerateApiKeyDto } from "./dto/GenerateApiKeyDto.js";
import { GetActiveApiKeyDto } from "./dto/GetActiveApiKeyDto.js";
import { RotateApiKeyDto } from "./dto/RotateApiKeyDto.js";
import MerchantRepository from "../merchant/repository/merchant.repository.js";
import {
  MerchantAccessDeniedError,
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
import { Merchant } from "../merchant/entity/merchant.entity.js";

@injectable()
export default class ApiKeyService {
  constructor(
    @inject(TYPES.ApiKeyRepository)
    private readonly apiKeyRepo: ApiKeyRepository,
    @inject(TYPES.MerchantRepository)
    private readonly merchantRepo: MerchantRepository,
  ) {}

  private async findActiveMerchantForUserOrThrow(
    userId: string,
    merchantId: string,
  ): Promise<Merchant> {
    const merchant = await this.merchantRepo.findById(merchantId);
    if (!merchant) throw new MerchantNotFoundError();
    if (merchant.userId !== userId) throw new MerchantAccessDeniedError();
    if (!merchant.isActive) {
      throw new MerchantInactiveError(
        "Inactive merchant cannot perform api key operations",
      );
    }
    return merchant;
  }

  async generateMerchantApiKey(input: GenerateApiKeyDto) {
    const { userId, merchantId, environment } = input;
    await this.findActiveMerchantForUserOrThrow(userId, merchantId);

    const existingApiKey = await this.apiKeyRepo.findActiveKey({
      merchantId,
      environment,
    });
    if (existingApiKey) {
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
    await this.findActiveMerchantForUserOrThrow(userId, merchantId);

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
    const { userId, apiKeyId, oldKeyRevokeStrategy } = input;

    const existingKey = await this.apiKeyRepo.findById(apiKeyId);
    if (!existingKey) throw new ApiKeyNotFoundError();
    if (existingKey.status !== "ACTIVE") {
      throw new ApiKeyNotFoundError("Only active api keys can be rotated");
    }

    await this.findActiveMerchantForUserOrThrow(
      userId,
      existingKey.merchant.id,
    );

    const revokeAt =
      oldKeyRevokeStrategy === "IMMEDIATELY"
        ? new Date()
        : addHours(new Date(), 24);

    const { keyId, keySecret } = generateApiKey(existingKey.environment);
    const secretHash = hashKeySecret(keySecret);

    const newKey = await dbTransaction(async (tx) => {
      await this.apiKeyRepo.revokeKeyForRotation(tx, {
        id: apiKeyId,
        revokeAt,
      });

      return this.apiKeyRepo.create(
        {
          merchantId: existingKey.merchant.id,
          keyId,
          secretHash,
          environment: existingKey.environment,
        },
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
