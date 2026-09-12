import { client, TransactionClient } from "@payvo/database/client";
import { ApiKeyCreateInput } from "@payvo/database/types";
import { injectable } from "inversify";
import { ApiKey, ApiKeyEnvironment } from "../entity/api-key.entity.js";
import { stringToDate, stringToDateNullable } from "@/core/utils/date.utils.js";

@injectable()
export default class ApiKeyRepository {
  private readonly db = client;

  async create(
    data: ApiKeyCreateInput,
    tx?: TransactionClient,
  ): Promise<ApiKey> {
    const apiKey = await (tx ?? this.db).orm.public.ApiKey.include(
      "merchant",
      (m) => m.select("id", "isActive", "userId"),
    ).create(data);

    return {
      ...apiKey,
      graceEndsAt: stringToDateNullable(apiKey.graceEndsAt),
      revokedAt: stringToDateNullable(apiKey.revokedAt),
      lastUsedAt: stringToDateNullable(apiKey.lastUsedAt),
      createdAt: stringToDate(apiKey.createdAt),
      updatedAt: stringToDate(apiKey.updatedAt),
    };
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
      .include("merchant", (m) => m.select("id", "isActive", "userId"))
      .first();

    if (!apiKey) {
      return null;
    }
    return {
      ...apiKey,
      graceEndsAt: stringToDateNullable(apiKey.graceEndsAt),
      revokedAt: stringToDateNullable(apiKey.revokedAt),
      lastUsedAt: stringToDateNullable(apiKey.lastUsedAt),
      createdAt: stringToDate(apiKey.createdAt),
      updatedAt: stringToDate(apiKey.updatedAt),
    };
  }

  async findById(id: string): Promise<ApiKey | null> {
    const apiKey = await this.db.orm.public.ApiKey.where({ id })
      .include("merchant", (m) => m.select("id", "isActive", "userId"))
      .first();

    if (!apiKey) {
      return null;
    }
    return {
      ...apiKey,
      graceEndsAt: stringToDateNullable(apiKey.graceEndsAt),
      revokedAt: stringToDateNullable(apiKey.revokedAt),
      lastUsedAt: stringToDateNullable(apiKey.lastUsedAt),
      createdAt: stringToDate(apiKey.createdAt),
      updatedAt: stringToDate(apiKey.updatedAt),
    };
  }

  async revokeKeyForRotation(
    tx: TransactionClient,
    data: { id: string; revokeAt: Date },
  ): Promise<ApiKey | null> {
    const { id, revokeAt } = data;
    const revokeNow = revokeAt <= new Date();
    const apiKey = await tx.orm.public.ApiKey.where({ id })
      .include("merchant", (m) => m.select("id", "isActive", "userId"))
      .update({
        graceEndsAt: revokeAt.toISOString(),
        status: revokeNow ? "REVOKED" : "GRACE_PERIOD",
        revokedAt: revokeNow ? revokeAt.toISOString() : null,
      });

    return apiKey
      ? {
          ...apiKey,
          graceEndsAt: stringToDateNullable(apiKey.graceEndsAt),
          revokedAt: stringToDateNullable(apiKey.revokedAt),
          lastUsedAt: stringToDateNullable(apiKey.lastUsedAt),
          createdAt: stringToDate(apiKey.createdAt),
          updatedAt: stringToDate(apiKey.updatedAt),
        }
      : null;
  }
}
