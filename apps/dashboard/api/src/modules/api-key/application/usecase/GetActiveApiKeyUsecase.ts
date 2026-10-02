import { injectable, inject } from "inversify";
import TYPES from "@/core/di/inversify.types.js";
import { GetActiveApiKeyDto } from "../dto/GetActiveApiKeyDto.js";
import ApiKeyRepository from "../../repository/api-key.repository.js";
import { ApiKeyNotFoundError } from "../../error/api-key.errors.js";
import MerchantAuthorizationService from "@/modules/merchant/application/merchant-authorization.service.js";

@injectable()
export default class GetActiveApiKeyUsecase {
  constructor(
    @inject(TYPES.ApiKeyRepository)
    private readonly apiKeyRepo: ApiKeyRepository,
    @inject(TYPES.MerchantAuthorizationService)
    private readonly merchantAuthorizationService: MerchantAuthorizationService,
  ) {}

  async execute(input: GetActiveApiKeyDto) {
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
