import { injectable, inject } from "inversify";
import TYPES from "@/core/di/inversify.types.js";
import { RevokeApiKeyInputDto } from "../dto/RevokeApiKeyDto.js";
import ApiKeyRepository from "../../repository/api-key.repository.js";
import {
  ApiKeyNotFoundError,
  RevokedApiKeyError,
} from "../../error/api-key.errors.js";
import MerchantAuthorizationService from "@/modules/merchant/application/merchant-authorization.service.js";

@injectable()
export default class RevokeApiKeyUsecase {
  constructor(
    @inject(TYPES.ApiKeyRepository)
    private readonly apiKeyRepo: ApiKeyRepository,
    @inject(TYPES.MerchantAuthorizationService)
    private readonly merchantAuthorizationService: MerchantAuthorizationService,
  ) {}

  async execute(input: RevokeApiKeyInputDto) {
    const { apiKeyId, userId, merchantId } = input;

    await this.merchantAuthorizationService.requireOwnedActiveMerchant(
      merchantId,
      userId,
      {
        inactiveMessage: "Inactive merchant cannot perform api key operations",
        notFoundMessage: "Merchant not found",
      },
    );

    const revokedKey = await this.apiKeyRepo.revokeById(apiKeyId);
    if (!revokedKey) {
      const apiKey = await this.apiKeyRepo.findById(apiKeyId);
      if (apiKey?.status === "REVOKED") {
        throw new RevokedApiKeyError("This api key has already been revoked");
      }
      throw new ApiKeyNotFoundError("Api key not found");
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
