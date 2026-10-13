import { createApiKeyCredentials, hashKeySecret } from "@payvo/shared/api-key";
import { inject, injectable } from "inversify";
import { MerchantTypes } from "../../../merchant/merchant.types.js";
import type { MerchantContract } from "../../../merchant/contract/merchant.contract.js";
import * as apiKeyErrors from "../../error/api-key.errors.js";
import ApiKeyMapper from "../../mapper/api-key.mapper.js";
import ApiKeyRepository from "../../repository/api-key.repository.js";
import { ApiKeyTypes } from "../../api-key.types.js";
import type {
  ApiKeyOutputDto,
  GetActiveApiKeyInputDto,
  GenerateApiKeyInputDto,
} from "../dto/api-key.dto.js";

@injectable()
export default class ApiKeyService {
  constructor(
    @inject(ApiKeyTypes.ApiKeyRepository)
    private readonly apiKeyRepo: ApiKeyRepository,
    @inject(ApiKeyTypes.ApiKeyMapper)
    private readonly apiKeyMapper: ApiKeyMapper,
    @inject(MerchantTypes.MerchantContract)
    private readonly merchantContract: MerchantContract,
  ) {}

  async generateApiKey(
    userId: string,
    input: GenerateApiKeyInputDto,
  ): Promise<ApiKeyOutputDto> {
    const merchant = await this.merchantContract.getActiveMerchantOwnedByUser(
      userId,
      input.merchantId,
    );
    const activeKey = await this.apiKeyRepo.findActiveKey({
      merchantId: merchant.id,
      environment: input.environment,
    });
    if (activeKey) {
      throw new apiKeyErrors.ApiKeyAlreadyExistsError();
    }

    const { keyId, keySecret } = createApiKeyCredentials(input.environment);
    const secretHash = hashKeySecret(keySecret);
    const apiKey = await this.apiKeyRepo.create({
      merchantId: merchant.id,
      keyId: keyId,
      secretHash: secretHash,
      environment: input.environment,
      status: "ACTIVE",
    });

    return this.apiKeyMapper.mapToApiKeyOutput(apiKey, keySecret);
  }

  async getActiveApiKey(
    userId: string,
    input: GetActiveApiKeyInputDto,
  ): Promise<ApiKeyOutputDto> {
    const merchant = await this.merchantContract.getActiveMerchantOwnedByUser(
      userId,
      input.merchantId,
    );
    const activeKey = await this.apiKeyRepo.findActiveKey({
      merchantId: merchant.id,
      environment: input.environment,
    });
    if (!activeKey) {
      throw new apiKeyErrors.ApiKeyNotFoundError(
        "No active api key found for this merchant and environment",
      );
    }

    return this.apiKeyMapper.mapToApiKeyOutput(activeKey);
  }
}
