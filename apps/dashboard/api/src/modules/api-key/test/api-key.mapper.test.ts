import "reflect-metadata";
import { describe, it, expect } from "vitest";
import ApiKeyMapper, { PrismaApiKeyWithMerchant } from "../api-key.mapper.js";

describe("ApiKeyMapper", () => {
  const mapper = new ApiKeyMapper();

  describe("toApiKeyEntity", () => {
    it("should map a PrismaApiKeyWithMerchant to an ApiKey entity correctly with Date conversions", () => {
      const createdAtStr = "2026-09-16T10:00:00.000Z";
      const updatedAtStr = "2026-09-16T11:00:00.000Z";
      const graceEndsAtStr = "2026-09-17T10:00:00.000Z";
      const revokedAtStr = "2026-09-17T10:00:00.000Z";
      const lastUsedAtStr = "2026-09-16T12:00:00.000Z";

      const prismaApiKey: PrismaApiKeyWithMerchant = {
        id: "key-123",
        keyId: "pk_test_123",
        secretHash: "hashed_secret",
        environment: "TEST",
        status: "ACTIVE",
        merchantId: "merchant-456",
        graceEndsAt: graceEndsAtStr,
        revokedAt: revokedAtStr,
        lastUsedAt: lastUsedAtStr,
        createdAt: createdAtStr,
        updatedAt: updatedAtStr,
        merchant: {
          id: "merchant-456",
          isActive: true,
          userId: "user-789",
        },
      };

      const result = mapper.toApiKeyEntity(prismaApiKey);

      expect(result).toEqual({
        id: "key-123",
        keyId: "pk_test_123",
        secretHash: "hashed_secret",
        environment: "TEST",
        status: "ACTIVE",
        graceEndsAt: new Date(graceEndsAtStr),
        revokedAt: new Date(revokedAtStr),
        lastUsedAt: new Date(lastUsedAtStr),
        createdAt: new Date(createdAtStr),
        updatedAt: new Date(updatedAtStr),
        merchantId: "merchant-456",
      });
      expect(result.createdAt).toBeInstanceOf(Date);
      expect(result.updatedAt).toBeInstanceOf(Date);
      expect(result.graceEndsAt).toBeInstanceOf(Date);
      expect(result.revokedAt).toBeInstanceOf(Date);
      expect(result.lastUsedAt).toBeInstanceOf(Date);
    });

    it("should handle null date fields properly", () => {
      const createdAtStr = "2026-09-16T10:00:00.000Z";
      const updatedAtStr = "2026-09-16T11:00:00.000Z";

      const prismaApiKey: PrismaApiKeyWithMerchant = {
        id: "key-123",
        keyId: "pk_test_123",
        secretHash: "hashed_secret",
        environment: "LIVE",
        status: "ACTIVE",
        merchantId: "merchant-456",
        graceEndsAt: null,
        revokedAt: null,
        lastUsedAt: null,
        createdAt: createdAtStr,
        updatedAt: updatedAtStr,
        merchant: {
          id: "merchant-456",
          isActive: true,
          userId: "user-789",
        },
      };

      const result = mapper.toApiKeyEntity(prismaApiKey);

      expect(result.graceEndsAt).toBeNull();
      expect(result.revokedAt).toBeNull();
      expect(result.lastUsedAt).toBeNull();
      expect(result.createdAt).toEqual(new Date(createdAtStr));
      expect(result.updatedAt).toEqual(new Date(updatedAtStr));
    });
  });

  describe("DI Container Binding", () => {
    it("should resolve ApiKeyMapper and ApiKeyRepository from container", async () => {
      const { Container } = await import("inversify");
      const { default: TYPES } = await import("@/core/di/inversify.types.js");
      const { default: ApiKeyRepository } = await import(
        "../repository/api-key.repository.js"
      );

      const container = new Container();
      container.bind(TYPES.ApiKeyMapper).to(ApiKeyMapper);
      container.bind(TYPES.ApiKeyRepository).to(ApiKeyRepository);

      const mapperInstance = container.get<ApiKeyMapper>(TYPES.ApiKeyMapper);
      expect(mapperInstance).toBeInstanceOf(ApiKeyMapper);

      const repoInstance = container.get<ApiKeyRepository>(
        TYPES.ApiKeyRepository,
      );
      expect(repoInstance).toBeInstanceOf(ApiKeyRepository);
    });
  });
});
