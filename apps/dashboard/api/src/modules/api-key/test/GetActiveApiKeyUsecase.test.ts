import { beforeEach, describe, expect, it, vi } from "vitest";
import GetActiveApiKeyUsecase from "../application/usecase/GetActiveApiKeyUsecase.js";
import { ApiKeyNotFoundError } from "../error/api-key.errors.js";
import {
  MerchantInactiveError,
  MerchantNotFoundError,
} from "@/modules/merchant/error/merchant.errors.js";

describe("GetActiveApiKeyUsecase", () => {
  const apiKeyRepository = { findActiveKey: vi.fn() };
  const merchantAuthorizationService = {
    requireOwnedActiveMerchant: vi.fn(),
  };
  const usecase = new GetActiveApiKeyUsecase(
    apiKeyRepository as never,
    merchantAuthorizationService as never,
  );

  const input = {
    userId: "user-1",
    merchantId: "merchant-1",
    environment: "TEST" as const,
  };

  const activeApiKey = {
    id: "key-uuid-1",
    merchantId: "merchant-1",
    keyId: "payvo_test_key123",
    secretHash: "hash-secret-123",
    environment: "TEST" as const,
    status: "ACTIVE" as const,
    graceEndsAt: null,
    revokedAt: null,
    lastUsedAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    merchantAuthorizationService.requireOwnedActiveMerchant.mockResolvedValue(
      undefined,
    );
    apiKeyRepository.findActiveKey.mockResolvedValue(activeApiKey);
  });

  it("returns active key details for the merchant and environment", async () => {
    const result = await usecase.execute(input);

    expect(
      merchantAuthorizationService.requireOwnedActiveMerchant,
    ).toHaveBeenCalledWith("merchant-1", "user-1", {
      inactiveMessage: "Inactive merchant cannot perform api key operations",
      notFoundMessage: "Merchant not found",
    });
    expect(apiKeyRepository.findActiveKey).toHaveBeenCalledWith({
      merchantId: "merchant-1",
      environment: "TEST",
    });
    expect(result).toEqual({
      id: activeApiKey.id,
      keyId: "payvo_test_key123",
      status: "ACTIVE",
      environment: "TEST",
      lastUsedAt: activeApiKey.lastUsedAt,
      generatedAt: activeApiKey.createdAt,
    });
  });

  it("does not query keys when the merchant is not found or owned", async () => {
    merchantAuthorizationService.requireOwnedActiveMerchant.mockRejectedValue(
      new MerchantNotFoundError(),
    );

    await expect(usecase.execute(input)).rejects.toBeInstanceOf(
      MerchantNotFoundError,
    );
    expect(apiKeyRepository.findActiveKey).not.toHaveBeenCalled();
  });

  it("does not query keys when the merchant is inactive", async () => {
    merchantAuthorizationService.requireOwnedActiveMerchant.mockRejectedValue(
      new MerchantInactiveError(),
    );

    await expect(usecase.execute(input)).rejects.toBeInstanceOf(
      MerchantInactiveError,
    );
    expect(apiKeyRepository.findActiveKey).not.toHaveBeenCalled();
  });

  it("throws when no active key exists for the environment", async () => {
    apiKeyRepository.findActiveKey.mockResolvedValue(null);

    await expect(usecase.execute(input)).rejects.toBeInstanceOf(
      ApiKeyNotFoundError,
    );
  });
});
