import type { ApiKey } from "@payvo/database/types";
import { injectable } from "inversify";
import type { ApiKeyOutputDto } from "../application/dto/api-key.dto.js";

@injectable()
export default class ApiKeyMapper {
  mapToApiKeyOutput(apiKey: ApiKey, keySecret?: string): ApiKeyOutputDto {
    return {
      id: apiKey.id,
      merchantId: apiKey.merchantId,
      keyId: apiKey.keyId,
      keySecret,
      environment: apiKey.environment,
      status: apiKey.status,
      graceEndsAt: apiKey.graceEndsAt,
      revokedAt: apiKey.revokedAt,
      lastUsedAt: apiKey.lastUsedAt,
      generatedAt: apiKey.createdAt,
    };
  }
}
