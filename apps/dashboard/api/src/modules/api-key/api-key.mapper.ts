import { ApiKey as PrismaApiKey } from "@payvo/database";
import { injectable } from "inversify";
import { ApiKey } from "./entity/api-key.entity.js";

@injectable()
export default class ApiKeyMapper {
  toApiKeyEntity(apiKey: PrismaApiKey): ApiKey {
    return {
      id: apiKey.id,
      merchantId: apiKey.merchantId,
      secretHash: apiKey.secretHash,
      environment: apiKey.environment,
      status: apiKey.status,
      keyId: apiKey.keyId,
      lastUsedAt: apiKey.lastUsedAt ? new Date(apiKey.lastUsedAt) : null,
      scheduleRevokeAt: apiKey.scheduleRevokeAt
        ? new Date(apiKey.scheduleRevokeAt)
        : null,
      revokedAt: apiKey.revokedAt ? new Date(apiKey.revokedAt) : null,
      createdAt: new Date(apiKey.createdAt),
      updatedAt: new Date(apiKey.updatedAt),
    };
  }
}
