import { injectable, inject } from "inversify";
import { generateApiKey, hashKeySecret } from "@payvo/shared/api-key";
import { dbTransaction } from "@payvo/database/client";
import { addHours } from "date-fns";
import TYPES from "@/core/di/inversify.types.js";
import { RotateApiKeyDto } from "../dto/RotateApiKeyDto.js";
import MerchantRepository from "@/modules/merchant/repository/merchant.repository.js";
import ApiKeyRepository from "../../repository/api-key.repository.js";
import { ApiKeyNotFoundError } from "../../error/api-key.errors.js";
import {
  MerchantInactiveError,
  MerchantNotFoundError,
} from "@/modules/merchant/error/merchant.errors.js";

@injectable()
export default class RotateApiKeyUsecase {
  constructor(
    @inject(TYPES.MerchantRepository)
    private readonly merchantRepository: MerchantRepository,
    @inject(TYPES.ApiKeyRepository)
    private readonly apiKeyRepo: ApiKeyRepository,
  ) {}

  async execute(input: RotateApiKeyDto) {
    const { userId, merchantId, oldKeyRevokeStrategy, environment } = input;

    const merchant = await this.merchantRepository.findOwnedByUser({
      merchantId,
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
