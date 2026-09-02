import TYPES from "@/core/di/inversify.types.js";
import { inject, injectable } from "inversify";
import ApiKeyRepository from "./repository/api-key.repository.js";
import { GenerateApiKeyDto } from "./dto/GenerateApiKeyDto.js";
import MerchantRepository from "../merchant/repository/merchant.repository.js";
import {
  MerchantInactiveError,
  MerchantNotFoundError,
  MerchantUserMismatchError,
} from "../merchant/error/merchant.errors.js";
import {
  ApiKeyAlreadyExistsError,
  ApiKeyNotFoundError,
} from "./error/api-key.errors.js";
import { generateApiKey, hashKeySecret } from "@payvo/shared/api-key";
import { GetMerchantActiveApiKeyDto } from "./dto/GetMerchantActiveApiKeyDto.js";
import { RotateMerchantApiKeyDto } from "./dto/RotateMerchantApiKeyDto.js";
import { db } from "@payvo/database";
import { addHours } from "date-fns";

@injectable()
export default class ApiKeyService {
  constructor(
    @inject(TYPES.ApiKeyRepository)
    private readonly apiKeyRepo: ApiKeyRepository,
    @inject(TYPES.MerchantRepository)
    private readonly merchantRepo: MerchantRepository,
  ) {}

  async generateApiKey(input: GenerateApiKeyDto) {
    const merchant = await this.merchantRepo.findMerchantById(input.merchantId);
    if (!merchant) {
      throw new MerchantNotFoundError("Merchant not found");
    }
    if (!merchant.isActive) {
      throw new MerchantInactiveError(
        "Inactive merchant cannot create api key",
      );
    }
    if (merchant.userId !== input.userId) {
      throw new MerchantUserMismatchError(
        "User is not authorized to create api key for this merchant",
      );
    }

    const existingActiveApiKey =
      await this.apiKeyRepo.findByMerchantIdForEnvironment(
        input.merchantId,
        input.environment,
      );
    if (existingActiveApiKey) {
      throw new ApiKeyAlreadyExistsError(
        `Active API key already exists for merchant with id ${input.merchantId} for environment ${input.environment}. Please revoke the existing API key before generating a new one or rotate the keys`,
      );
    }
    const apiKey = generateApiKey(input.environment);

    const createdApiKey = await this.apiKeyRepo.create({
      merchantId: input.merchantId,
      environment: input.environment,
      keyId: apiKey.keyId,
      secretHash: hashKeySecret(apiKey.keySecret),
    });

    return {
      apiKey: createdApiKey,
      keySecret: apiKey.keySecret,
    };
  }

  async getMerchantActiveApiKey(input: GetMerchantActiveApiKeyDto) {
    const merchant = await this.merchantRepo.findMerchantById(input.merchantId);
    if (!merchant) {
      throw new MerchantNotFoundError("Merchant not found");
    }
    if (merchant.userId !== input.userId) {
      throw new MerchantUserMismatchError(
        "User is not authorized to get api key for this merchant",
      );
    }
    if (!merchant.isActive) {
      throw new MerchantInactiveError("Inactive merchant cannot get api key");
    }

    const existingActiveApiKey =
      await this.apiKeyRepo.findByMerchantIdForEnvironment(
        input.merchantId,
        input.environment,
      );
    if (!existingActiveApiKey) {
      throw new ApiKeyNotFoundError(
        `No active api key is found for this merchant in ${input.environment} environment`,
      );
    }

    return {
      apiKey: existingActiveApiKey,
    };
  }

  async rotateApiKey(input: RotateMerchantApiKeyDto) {
    const merchant = await this.merchantRepo.findMerchantById(input.merchantId);
    if (!merchant) {
      throw new MerchantNotFoundError("Merchant not found");
    }
    if (merchant.userId !== input.userId) {
      throw new MerchantUserMismatchError(
        "User is not authorized to rotate api key for this merchant",
      );
    }
    if (!merchant.isActive) {
      throw new MerchantInactiveError(
        "Inactive merchant cannot rotate api key",
      );
    }

    return await db.transaction(async (tx) => {
      const revokeTime =
        input.oldKeyRevokeStrategy === "IMMEDIATELY"
          ? new Date()
          : addHours(new Date(), 24);
      const updatedApiKey = await this.apiKeyRepo.scheduleRevoke(
        {
          merchantId: input.merchantId,
          environment: input.environment,
          revokeTime,
        },
        tx,
      );
      if (!updatedApiKey) {
        throw new ApiKeyNotFoundError(
          `No active api key is found for this merchant for ${input.environment} environment`,
        );
      }
      const apiKey = generateApiKey(input.environment);

      const createdApiKey = await this.apiKeyRepo.create(
        {
          merchantId: input.merchantId,
          environment: input.environment,
          keyId: apiKey.keyId,
          secretHash: hashKeySecret(apiKey.keySecret),
        },
        tx,
      );

      return { apiKey: createdApiKey, keySecret: apiKey.keySecret };
    });
  }
}
