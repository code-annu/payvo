import { injectable, inject } from "inversify";
import TYPES from "@/core/di/inversify.types.js";
import { RevokeApiKeyDto } from "../dto/RevokeApiKeyDto.js";
import MerchantRepository from "@/modules/merchant/repository/merchant.repository.js";
import ApiKeyRepository from "../../repository/api-key.repository.js";
import {
  ApiKeyNotFoundError,
  RevokedApiKeyError,
} from "../../error/api-key.errors.js";
import {
  MerchantInactiveError,
  MerchantNotFoundError,
} from "@/modules/merchant/error/merchant.errors.js";

@injectable()
export default class RevokeApiKeyUsecase {
  constructor(
    @inject(TYPES.MerchantRepository)
    private readonly merchantRepository: MerchantRepository,
    @inject(TYPES.ApiKeyRepository)
    private readonly apiKeyRepo: ApiKeyRepository,
  ) {}

  async execute(input: RevokeApiKeyDto) {
    const { apiKeyId, userId } = input;

    const apiKey = await this.apiKeyRepo.findById(apiKeyId);
    if (!apiKey) {
      throw new ApiKeyNotFoundError("Api key not found");
    }

    if (apiKey.status === "REVOKED") {
      throw new RevokedApiKeyError();
    }

    const merchant = await this.merchantRepository.findOwnedByUser({
      merchantId: apiKey.merchantId,
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

    const revokedKey = await this.apiKeyRepo.revokeById(apiKeyId);
    if (!revokedKey) {
      throw new RevokedApiKeyError();
    }

    return {
      id: revokedKey.id,
      keyId: revokedKey.keyId,
      status: revokedKey.status,
      environment: revokedKey.environment,
      revokedAt: revokedKey.revokedAt,
    };
  }
}
