import type { ApiKey as PrismaApiKey } from "@payvo/database/types";
import { injectable } from "inversify";
import type { ApiKey } from "./entity/api-key.entity.js";

@injectable()
export default class ApiKeyMapper {
  toApiKeyEntity(apiKey: PrismaApiKey): ApiKey {
    return {
      id: apiKey.id,
      merchantId: apiKey.merchantId,
      keyId: apiKey.keyId,
      secretHash: apiKey.secretHash,
      environment: apiKey.environment as ApiKey["environment"],
      status: apiKey.status as ApiKey["status"],
      graceEndsAt: apiKey.graceEndsAt ? new Date(apiKey.graceEndsAt) : null,
      revokedAt: apiKey.revokedAt ? new Date(apiKey.revokedAt) : null,
      lastUsedAt: apiKey.lastUsedAt ? new Date(apiKey.lastUsedAt) : null,
      createdAt: new Date(apiKey.createdAt),
      updatedAt: new Date(apiKey.updatedAt),
    };
  }
}
