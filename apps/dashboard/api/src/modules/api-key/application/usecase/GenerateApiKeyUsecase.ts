import { injectable, inject } from "inversify";
import { generateApiKey, hashKeySecret } from "@payvo/shared/api-key";
import TYPES from "@/core/di/inversify.types.js";
import { GenerateApiKeyDto } from "../dto/GenerateApiKeyDto.js";
import MerchantRepository from "@/modules/merchant/repository/merchant.repository.js";
import ApiKeyRepository from "../../repository/api-key.repository.js";
import { ApiKeyAlreadyExistsError } from "../../error/api-key.errors.js";
import { Merchant } from "@/modules/merchant/entity/merchant.entity.js";
import {
  MerchantInactiveError,
  MerchantNotFoundError,
} from "@/modules/merchant/error/merchant.errors.js";

@injectable()
export default class GenerateApiKeyUsecase {
  constructor(
    @inject(TYPES.MerchantRepository)
    private readonly merchantRepository: MerchantRepository,
    @inject(TYPES.ApiKeyRepository)
    private readonly apiKeyRepo: ApiKeyRepository,
  ) {}

  private async findActiveMerchantOrThrow(
    userId: string,
    merchantId: string,
  ): Promise<Merchant> {
    const merchant = await this.merchantRepository.findOwnedByUser({
      merchantId,
      userId,
    });
    if (!merchant) {
      throw new MerchantNotFoundError();
    }
    if (!merchant.isActive) {
      throw new MerchantInactiveError(
        "Inactive merchant cannot perform api key operations",
      );
    }
    return merchant;
  }

  async execute(input: GenerateApiKeyDto) {
    const { userId, merchantId, environment } = input;
    const merchant = await this.merchantRepository.findOwnedByUser({
      merchantId,
      userId,
    });
    if (!merchant) {
      throw new MerchantNotFoundError();
    }
    if (!merchant.isActive) {
      throw new MerchantInactiveError(
        "Inactive merchant cannot perform api key operations",
      );
    }

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
}
