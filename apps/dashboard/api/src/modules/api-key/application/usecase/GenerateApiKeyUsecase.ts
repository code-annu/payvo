import { injectable, inject } from "inversify";
import { generateApiKey, hashKeySecret } from "@payvo/shared/api-key";
import TYPES from "@/core/di/inversify.types.js";
import { GenerateApiKeyDto } from "../dto/GenerateApiKeyDto.js";
import ApiKeyRepository from "../../repository/api-key.repository.js";
import { ApiKeyAlreadyExistsError } from "../../error/api-key.errors.js";
import MerchantAuthorizationService from "@/modules/merchant/application/merchant-authorization.service.js";

@injectable()
export default class GenerateApiKeyUsecase {
  constructor(
    @inject(TYPES.ApiKeyRepository)
    private readonly apiKeyRepo: ApiKeyRepository,
    @inject(TYPES.MerchantAuthorizationService)
    private readonly merchantAuthorizationService: MerchantAuthorizationService,
  ) {}

  async execute(input: GenerateApiKeyDto) {
    const { userId, merchantId, environment } = input;

    await this.merchantAuthorizationService.requireOwnedActiveMerchant(
      merchantId,
      userId,
      {
        inactiveMessage: "Inactive merchant cannot perform api key operations",
        notFoundMessage: "Merchant not found",
      },
    );

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
