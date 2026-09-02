import TYPES from "@/core/di/inversify.types.js";
import { inject, injectable } from "inversify";
import ApiKeyMapper from "../api-key.mapper.js";
import { db, TransactionClient } from "@payvo/database";
import { ApiKey, Environment } from "../entity/api-key.entity.js";
import {
  ApiKeyCreateInput,
  ApiKeyScheduleRevokeInput,
} from "../entity/input.entity.js";

@injectable()
export default class ApiKeyRepository {
  constructor(
    @inject(TYPES.ApiKeyMapper) private readonly mapper: ApiKeyMapper,
  ) {}

  async create(
    data: ApiKeyCreateInput,
    tx?: TransactionClient,
  ): Promise<ApiKey> {
    const apiKey = await (tx ?? db).orm.public.ApiKey.create(data);
    return this.mapper.toApiKeyEntity(apiKey);
  }

  async scheduleRevoke(
    data: ApiKeyScheduleRevokeInput,
    tx: TransactionClient,
  ): Promise<ApiKey | null> {
    const revokeNow = data.revokeTime <= new Date();
    const updatedApiKey = await tx.orm.public.ApiKey.where({
      merchantId: data.merchantId,
      environment: data.environment,
      status: "ACTIVE",
    }).update({
      scheduleRevokeAt: data.revokeTime.toISOString(),
      revokedAt: revokeNow ? data.revokeTime.toISOString() : null,
      status: revokeNow ? "REVOKED" : "ACTIVE",
    });

    return updatedApiKey ? this.mapper.toApiKeyEntity(updatedApiKey) : null;
  }
  async findByMerchantIdForEnvironment(
    merchantId: string,
    environment: Environment,
    tx?: TransactionClient,
  ): Promise<ApiKey | null> {
    const apiKey = await (tx ?? db).orm.public.ApiKey.where({
      merchantId,
      environment,
      status: "ACTIVE",
      scheduleRevokeAt: null,
      revokedAt: null,
    }).first();
    return apiKey ? this.mapper.toApiKeyEntity(apiKey) : null;
  }

 
}
