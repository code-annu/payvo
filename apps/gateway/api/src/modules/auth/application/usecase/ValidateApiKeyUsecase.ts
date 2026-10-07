import { inject, injectable } from "inversify";
import TYPES from "@/core/di/inversify.types.js";
import ApiKeyRepository from "../../repository/api-key.repository.js";
import { hashKeySecret } from "@payvo/shared/api-key";
import {
  InvalidApiKeyCredentialsError,
  RevokedApiKeyError,
} from "../../error/auth.errors.js";
import type {
  ValidateApiKeyInputDto,
  ValidateApiKeyOutputDto,
} from "../dto/ValidateApiKeyDto.js";
import ApiKeyCache from "../../api-key.cache.js";

@injectable()
export default class ValidateApiKeyUsecase {
  constructor(
    @inject(TYPES.ApiKeyRepository)
    private readonly apiKeyRepo: ApiKeyRepository,
    @inject(TYPES.ApiKeyCache)
    private readonly apiKeyCache: ApiKeyCache,
  ) {}

  async execute(
    input: ValidateApiKeyInputDto,
  ): Promise<ValidateApiKeyOutputDto> {
    const { keyId, keySecret } = input;
    const apiKey = await this.apiKeyCache.getCachedApiKey(keyId);

    if (!apiKey || apiKey.secretHash !== hashKeySecret(keySecret)) {
      throw new InvalidApiKeyCredentialsError("Invalid API key id or secret");
    }

    if (apiKey.status === "REVOKED") {
      throw new RevokedApiKeyError(
        "Revoked api key cannot create payment order",
      );
    }

    const merchant = await this.apiKeyRepo.findMerchantById(apiKey.merchantId);
    if (!merchant || !merchant.isActive) {
      throw new InvalidApiKeyCredentialsError(
        "Api key is associated with inactive or deleted merchant",
      );
    }

    const user = await this.apiKeyRepo.findUserById(merchant.userId);
    if (!user) {
      throw new InvalidApiKeyCredentialsError(
        "Api key is associated with deleted user",
      );
    }

    await this.apiKeyRepo.updateLastUsedAt(apiKey.id);

    return {
      valid: true,
      merchantId: apiKey.merchantId,
      environment: apiKey.environment,
    };
  }
}
