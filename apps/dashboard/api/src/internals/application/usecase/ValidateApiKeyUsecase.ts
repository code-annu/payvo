import TYPES from "@/core/di/inversify.types.js";
import ApiKeyRepository from "@/modules/api-key/repository/api-key.repository.js";
import MerchantRepository from "@/modules/merchant/repository/merchant.repository.js";
import UserRepository from "@/modules/user/repository/user.repository.js";
import { inject, injectable } from "inversify";
import { ValidateApiKeyDto } from "../dto/ValidateApiKeyDto.js";
import { hashKeySecret } from "@payvo/shared/api-key";
import {
  InvalidApiKeyCredentialsError,
  RevokedApiKeyError,
} from "@/modules/api-key/error/api-key.errors.js";

@injectable()
export default class ValidateApiKeyUsecase {
  constructor(
    @inject(TYPES.ApiKeyRepository)
    private readonly apiKeyRepo: ApiKeyRepository,
    @inject(TYPES.UserRepository)
    private readonly userRepo: UserRepository,
    @inject(TYPES.MerchantRepository)
    private readonly merchantRepo: MerchantRepository,
  ) {}

  async execute(input: ValidateApiKeyDto) {
    const { keyId, keySecret } = input;
    const apiKey = await this.apiKeyRepo.findByKeyId(keyId);

    if (!apiKey || apiKey.secretHash !== hashKeySecret(keySecret)) {
      throw new InvalidApiKeyCredentialsError("Invalid API key id or secret");
    }
    if (apiKey.status === "REVOKED") {
      throw new RevokedApiKeyError("Api key is revoked");
    }

    const merchant = await this.merchantRepo.findById(apiKey.merchantId);
    if (!merchant || !merchant.isActive) {
      throw new InvalidApiKeyCredentialsError(
        "Api key is associated with inactive or deleted merchant",
      );
    }

    const user = await this.userRepo.findById(merchant.userId);
    if (!user) {
      throw new InvalidApiKeyCredentialsError(
        "Api key is associated with deleted user",
      );
    }

    return apiKey;
  }
}
