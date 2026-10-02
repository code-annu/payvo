import { inject, injectable } from "inversify";
import TYPES from "@/core/di/inversify.types.js";
import ApiKeyRepository from "../../repository/api-key.repository.js";
import type {
  ListMerchantApiKeysInputDto,
  ListMerchantApiKeysOutputDto,
} from "../dto/ListMerchantApiKeysDto.js";
import MerchantAuthorizationService from "@/modules/merchant/application/merchant-authorization.service.js";

@injectable()
export default class ListMerchantApiKeysUsecase {
  constructor(
    @inject(TYPES.ApiKeyRepository)
    private readonly apiKeyRepository: ApiKeyRepository,
    @inject(TYPES.MerchantAuthorizationService)
    private readonly merchantAuthorizationService: MerchantAuthorizationService,
  ) {}

  async execute(
    input: ListMerchantApiKeysInputDto,
  ): Promise<ListMerchantApiKeysOutputDto> {
    await this.merchantAuthorizationService.requireOwnedActiveMerchant(
      input.merchantId,
      input.userId,
      {
        inactiveMessage: "Inactive merchant cannot perform api key operations",
        notFoundMessage: "Merchant not found",
      },
    );

    const apiKeys = await this.apiKeyRepository.findByMerchantId(
      input.merchantId,
    );

    return {
      merchantId: input.merchantId,
      apiKeys: apiKeys.map((apiKey) => ({
        id: apiKey.id,
        status: apiKey.status,
        environment: apiKey.environment,
        graceEndsAt: apiKey.graceEndsAt,
        revokedAt: apiKey.revokedAt,
        lastUsedAt: apiKey.lastUsedAt,
      })),
    };
  }
}
