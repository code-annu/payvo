import { injectable, inject } from "inversify";
import TYPES from "@/core/di/inversify.types.js";
import { GetActiveApiKeyDto } from "../dto/GetActiveApiKeyDto.js";
import MerchantRepository from "@/modules/merchant/repository/merchant.repository.js";
import ApiKeyRepository from "../../repository/api-key.repository.js";
import { ApiKeyNotFoundError } from "../../error/api-key.errors.js";
import { Merchant } from "@/modules/merchant/entity/merchant.entity.js";
import {
  MerchantInactiveError,
  MerchantNotFoundError,
} from "@/modules/merchant/error/merchant.errors.js";

@injectable()
export default class GetActiveApiKeyUsecase {
  constructor(
    @inject(TYPES.MerchantRepository)
    private readonly merchantRepository: MerchantRepository,
    @inject(TYPES.ApiKeyRepository)
    private readonly apiKeyRepo: ApiKeyRepository,
  ) {}

  async execute(input: GetActiveApiKeyDto) {
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
    if (!activeKey) {
      throw new ApiKeyNotFoundError(
        "No active api key found for this merchant and environment",
      );
    }

    return {
      id: activeKey.id,
      keyId: activeKey.keyId,
      status: activeKey.status,
      environment: activeKey.environment,
      lastUsedAt: activeKey.lastUsedAt,
      generatedAt: activeKey.createdAt,
    };
  }
}
