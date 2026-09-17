import TYPES from "@/core/di/inversify.types.js";
import ApiKeyRepository from "@/modules/api-key/repository/api-key.repository.js";
import { inject, injectable } from "inversify";
import { ValidateApiKeyDto } from "./dto/ValidateApiKeyDto.js";
import {
  InvalidApiKeyCredentialsError,
  RevokedApiKeyError,
} from "@/modules/api-key/error/api-key.errors.js";
import { hashKeySecret } from "@payvo/shared/api-key";
import UserCacheService from "@/modules/user/user-cache.service.js";
import MerchantCacheService from "@/modules/merchant/merchant-cache.service.js";

@injectable()
export default class InternalService {
  constructor(
    @inject(TYPES.ApiKeyRepository)
    private readonly apiKeyRepo: ApiKeyRepository,
    @inject(TYPES.UserCacheService)
    private readonly userCacheService: UserCacheService,
    @inject(TYPES.MerchantCacheService)
    private readonly merchantCacheService: MerchantCacheService,
  ) {}

  async validateApiKey(input: ValidateApiKeyDto) {
    const apiKey = await this.apiKeyRepo.findByKeyId(input.keyId);
    if (!apiKey || apiKey.secretHash !== hashKeySecret(input.keySecret)) {
      throw new InvalidApiKeyCredentialsError("Invalid API key id or secret");
    }
    if (apiKey.status === "REVOKED") {
      throw new RevokedApiKeyError("Api key is revoked");
    }

    const merchant = await this.merchantCacheService.getCachedMerchant(
      apiKey.merchantId,
    );
    if (!merchant || !merchant.isActive) {
      throw new InvalidApiKeyCredentialsError(
        "Api key is associated with inactive or deleted merchant",
      );
    }

    const cachedUser = await this.userCacheService.getCachedUser(
      merchant.userId,
    );
    if (!cachedUser || cachedUser.deletedAt) {
      throw new InvalidApiKeyCredentialsError(
        "Api key is associated with deleted user",
      );
    }

    return apiKey;
  }
}
