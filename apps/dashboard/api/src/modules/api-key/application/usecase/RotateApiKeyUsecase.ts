import { injectable, inject } from "inversify";
import { generateApiKey, hashKeySecret } from "@payvo/shared/api-key";
import { dbTransaction } from "@payvo/database/client";
import { addHours } from "date-fns";
import TYPES from "@/core/di/inversify.types.js";
import { RotateApiKeyDto } from "../dto/RotateApiKeyDto.js";
import ApiKeyRepository from "../../repository/api-key.repository.js";
import { ApiKeyNotFoundError } from "../../error/api-key.errors.js";
import MerchantAuthorizationService from "@/modules/merchant/application/merchant-authorization.service.js";

@injectable()
export default class RotateApiKeyUsecase {
  constructor(
    @inject(TYPES.ApiKeyRepository)
    private readonly apiKeyRepo: ApiKeyRepository,
    @inject(TYPES.MerchantAuthorizationService)
    private readonly merchantAuthorizationService: MerchantAuthorizationService,
  ) {}

  async execute(input: RotateApiKeyDto) {
    const { userId, merchantId, oldKeyRevokeStrategy, environment } = input;

    await this.merchantAuthorizationService.requireOwnedActiveMerchant(
      merchantId,
      userId,
      {
        inactiveMessage: "Inactive merchant cannot perform api key operations",
        notFoundMessage: "Merchant not found",
      },
    );

    const revokeAt =
      oldKeyRevokeStrategy === "IMMEDIATELY"
        ? new Date()
        : addHours(new Date(), 24);

    const { keyId, keySecret } = generateApiKey(environment);
    const secretHash = hashKeySecret(keySecret);

    const newKey = await dbTransaction(async (tx) => {
      const revokedKey = await this.apiKeyRepo.revokeKeyForRotation(tx, {
        merchantId,
        revokeAt,
      });
      if (!revokedKey) throw new ApiKeyNotFoundError();

      return this.apiKeyRepo.create(
        { merchantId, keyId, secretHash, environment },
        tx,
      );
    });

    return {
      id: newKey.id,
      keyId,
      keySecret,
      status: newKey.status,
      environment: newKey.environment,
      generatedAt: newKey.createdAt,
    };
  }
}
