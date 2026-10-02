import { beforeEach, describe, expect, it, vi } from "vitest";
import RevokeApiKeyUsecase from "../application/usecase/RevokeApiKeyUsecase.js";
import {
  ApiKeyNotFoundError,
  RevokedApiKeyError,
} from "../error/api-key.errors.js";
import {
  MerchantInactiveError,
  MerchantNotFoundError,
} from "@/modules/merchant/error/merchant.errors.js";

describe("RevokeApiKeyUsecase", () => {
  const apiKeyRepository = { findById: vi.fn(), revokeById: vi.fn() };
  const merchantAuthorizationService = {
    requireOwnedActiveMerchant: vi.fn(),
  };
  const usecase = new RevokeApiKeyUsecase(
    apiKeyRepository as never,
    merchantAuthorizationService as never,
  );

  const input = {
    apiKeyId: "key-uuid-1",
    merchantId: "merchant-1",
    userId: "user-1",
  };

  const activeApiKey = {
    id: "key-uuid-1",
    merchantId: "merchant-1",
    keyId: "payvo_live_123",
    status: "ACTIVE" as const,
    environment: "LIVE" as const,
    secretHash: "hash-123",
    graceEndsAt: null,
    revokedAt: null,
    lastUsedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const revokedApiKey = {
    ...activeApiKey,
    status: "REVOKED" as const,
    revokedAt: new Date(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    merchantAuthorizationService.requireOwnedActiveMerchant.mockResolvedValue(
      undefined,
    );
    apiKeyRepository.revokeById.mockResolvedValue(revokedApiKey);
    apiKeyRepository.findById.mockResolvedValue(null);
  });

  it("revokes the key and returns the revocation details", async () => {
    const result = await usecase.execute(input);

    expect(
      merchantAuthorizationService.requireOwnedActiveMerchant,
    ).toHaveBeenCalledWith("merchant-1", "user-1", {
      inactiveMessage: "Inactive merchant cannot perform api key operations",
      notFoundMessage: "Merchant not found",
    });
    expect(apiKeyRepository.revokeById).toHaveBeenCalledWith("key-uuid-1");
    expect(result).toEqual({
      id: revokedApiKey.id,
      keyId: revokedApiKey.keyId,
      status: "REVOKED",
      environment: "LIVE",
      revokedAt: revokedApiKey.revokedAt,
    });
  });

  it("throws ApiKeyNotFoundError when the key does not exist", async () => {
    apiKeyRepository.revokeById.mockResolvedValue(null);

    await expect(usecase.execute(input)).rejects.toBeInstanceOf(
      ApiKeyNotFoundError,
    );
    expect(apiKeyRepository.findById).toHaveBeenCalledWith("key-uuid-1");
  });

  it("throws RevokedApiKeyError when the key was already revoked", async () => {
    apiKeyRepository.revokeById.mockResolvedValue(null);
    apiKeyRepository.findById.mockResolvedValue(revokedApiKey);

    await expect(usecase.execute(input)).rejects.toBeInstanceOf(
      RevokedApiKeyError,
    );
    expect(apiKeyRepository.findById).toHaveBeenCalledWith("key-uuid-1");
  });

  it("does not revoke keys when the merchant is not found or owned", async () => {
    merchantAuthorizationService.requireOwnedActiveMerchant.mockRejectedValue(
      new MerchantNotFoundError(),
    );

    await expect(usecase.execute(input)).rejects.toBeInstanceOf(
      MerchantNotFoundError,
    );
    expect(apiKeyRepository.revokeById).not.toHaveBeenCalled();
  });

  it("does not revoke keys when the merchant is inactive", async () => {
    merchantAuthorizationService.requireOwnedActiveMerchant.mockRejectedValue(
      new MerchantInactiveError(),
    );

    await expect(usecase.execute(input)).rejects.toBeInstanceOf(
      MerchantInactiveError,
    );
    expect(apiKeyRepository.revokeById).not.toHaveBeenCalled();
  });
});
