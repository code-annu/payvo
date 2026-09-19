import { injectable, inject } from "inversify";
import ApiKeyMapper from "../api-key.mapper.js";
import TYPES from "@/core/di/inversify.types.js";
import { client, TransactionClient } from "@payvo/database/client";
import { ApiKeyCreateInput } from "@payvo/database/types";
import { ApiKey, ApiKeyEnvironment } from "../entity/api-key.entity.js";

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

  async findActiveKey(data: {
    merchantId: string;
    environment: ApiKeyEnvironment;
  }): Promise<ApiKey | null> {
    const apiKey = await this.db.orm.public.ApiKey.first({
      merchantId: data.merchantId,
      environment: data.environment,
      status: "ACTIVE",
    });
    return apiKey ? this.mapper.toApiKeyEntity(apiKey) : null;
  }

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

  async findById(id: string): Promise<ApiKey | null> {
    const apiKey = await this.db.orm.public.ApiKey.first({ id });
    return apiKey ? this.mapper.toApiKeyEntity(apiKey) : null;
  }

  async findByKeyId(keyId: string): Promise<ApiKey | null> {
    const apiKey = await this.db.orm.public.ApiKey.first({ keyId });
    return apiKey ? this.mapper.toApiKeyEntity(apiKey) : null;
  }

  async revokeById(id: string): Promise<ApiKey | null> {
    const now = new Date().toISOString();
    const apiKey = await this.db.orm.public.ApiKey.where({ id })
      .where((k) => k.status.neq("REVOKED"))
      .update({
        status: "REVOKED",
        revokedAt: now,
      });
    return apiKey ? this.mapper.toApiKeyEntity(apiKey) : null;
  }
}
