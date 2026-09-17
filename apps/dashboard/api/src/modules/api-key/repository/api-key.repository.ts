import { client, TransactionClient } from "@payvo/database/client";
import { ApiKeyCreateInput } from "@payvo/database/types";
import { inject, injectable } from "inversify";
import { ApiKey, ApiKeyEnvironment } from "../entity/api-key.entity.js";
import TYPES from "@/core/di/inversify.types.js";
import ApiKeyMapper from "../api-key.mapper.js";

@injectable()
export default class ApiKeyRepository {
  private readonly db = client;

  constructor(
    @inject(TYPES.ApiKeyMapper) private readonly mapper: ApiKeyMapper,
  ) {}

  async create(
    data: ApiKeyCreateInput,
    tx?: TransactionClient,
  ): Promise<ApiKey> {
    const apiKey = await (tx ?? this.db).orm.public.ApiKey.create(data);

    return this.mapper.toApiKeyEntity(apiKey);
  }

  async findActiveKey(
    data: { merchantId: string; environment: ApiKeyEnvironment },
    tx?: TransactionClient,
  ): Promise<ApiKey | null> {
    const { merchantId, environment } = data;
    const apiKey = await (tx ?? this.db).orm.public.ApiKey.where({
      merchantId,
      status: "ACTIVE",
      environment,
    })
      .orderBy((k) => k.createdAt.desc())
      .limit(1)
      .first();

    return apiKey ? this.mapper.toApiKeyEntity(apiKey) : null;
  }

  // async findById(id: string): Promise<ApiKey | null> {
  //   const apiKey = await this.db.orm.public.ApiKey.where({ id }).first();

  //   return apiKey ? this.mapper.toApiKeyEntity(apiKey) : null;
  // }

  async revokeKeyForRotation(
    tx: TransactionClient,
    data: { merchantId: string; revokeAt: Date },
  ): Promise<ApiKey | null> {
    const { merchantId, revokeAt } = data;
    const revokeNow = revokeAt <= new Date();
    const apiKey = await tx.orm.public.ApiKey.where({
      merchantId,
      status: "ACTIVE",
      revokedAt: null,
      graceEndsAt: null,
    }).update({
      graceEndsAt: revokeAt.toISOString(),
      status: revokeNow ? "REVOKED" : "GRACE_PERIOD",
      revokedAt: revokeNow ? revokeAt.toISOString() : null,
    });

    return apiKey ? this.mapper.toApiKeyEntity(apiKey) : null;
  }

  async findByKeyId(keyId: string): Promise<ApiKey | null> {
    const apiKey = await this.db.orm.public.ApiKey.where({ keyId }).first();

    return apiKey ? this.mapper.toApiKeyEntity(apiKey) : null;
  }
}
