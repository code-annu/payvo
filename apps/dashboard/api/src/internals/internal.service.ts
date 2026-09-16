import TYPES from "@/core/di/inversify.types.js";
import ApiKeyRepository from "@/modules/api-key/repository/api-key.repository.js";
import { inject, injectable } from "inversify";
import { ValidateApiKeyDto } from "./dto/ValidateApiKeyDto.js";
import {
  ApiKeyInvalidError,
  ApiKeyRevokedError,
} from "@/modules/api-key/error/api-key.errors.js";
import { MerchantInactiveError } from "@/modules/merchant/error/merchant.errors.js";
import { hashKeySecret } from "@payvo/shared/api-key";

@injectable()
export default class InternalService {
  constructor(
    @inject(TYPES.ApiKeyRepository)
    private readonly apiKeyRepo: ApiKeyRepository,
  ) {}

  async validateApiKey(input: ValidateApiKeyDto) {
    const apiKey = await this.apiKeyRepo.findByKeyId(input.keyId);
    console.log("apiKey", apiKey);
    if (!apiKey || apiKey.secretHash !== hashKeySecret(input.keySecret)) {
      throw new ApiKeyInvalidError("Invalid API key id or secret");
    }
    if (!apiKey.merchant.isActive) {
      throw new MerchantInactiveError("This key belongs to inactive merchant");
    }
    if (
      apiKey.status === "REVOKED" ||
      (apiKey.graceEndsAt && apiKey.graceEndsAt <= new Date())
    ) {
      throw new ApiKeyRevokedError(
        "Revoked api key cannot be used to perform this action",
      );
    }
    return apiKey;
  }
}
