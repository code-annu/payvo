import { beforeEach, describe, expect, it, vi } from "vitest";
import GetActiveApiKeyUsecase from "../application/usecase/GetActiveApiKeyUsecase.js";
import { ApiKeyNotFoundError } from "../error/api-key.errors.js";
import {
  MerchantInactiveError,
  MerchantNotFoundError,
} from "@/modules/merchant/error/merchant.errors.js";

describe("GetActiveApiKeyUsecase", () => {
  const merchantRepository = { findOwnedByUser: vi.fn() };
  const apiKeyRepo = { findActiveKey: vi.fn() };
  const usecase = new GetActiveApiKeyUsecase(
    merchantRepository as never,
    apiKeyRepo as never,
  );

  const input = {
    userId: "user-1",
    merchantId: "merchant-1",
    environment: "TEST" as const,
  };

  const merchant = {
    id: "merchant-1",
    mid: "mid-1",
    userId: "user-1",
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
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
    merchantRepository.findOwnedByUser.mockResolvedValue(merchant);
    apiKeyRepo.findActiveKey.mockResolvedValue(activeApiKey);
  });

  it("returns active api key details for merchant and environment", async () => {
    const result = await usecase.execute(input);

    expect(merchantRepository.findOwnedByUser).toHaveBeenCalledWith({
      merchantId: "merchant-1",
      userId: "user-1",
    });
    expect(apiKeyRepo.findActiveKey).toHaveBeenCalledWith({
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

  it("throws MerchantNotFoundError when merchant does not exist for the user", async () => {
    merchantRepository.findOwnedByUser.mockResolvedValue(null);

    await expect(usecase.execute(input)).rejects.toBeInstanceOf(
      MerchantNotFoundError,
    );
    expect(apiKeyRepo.findActiveKey).not.toHaveBeenCalled();
  });

  it("throws MerchantInactiveError when merchant is inactive", async () => {
    merchantRepository.findOwnedByUser.mockResolvedValue({
      ...merchant,
      isActive: false,
    });

    await expect(usecase.execute(input)).rejects.toBeInstanceOf(
      MerchantInactiveError,
    );
    expect(apiKeyRepo.findActiveKey).not.toHaveBeenCalled();
  });

  it("throws ApiKeyNotFoundError when active api key is not found", async () => {
    apiKeyRepo.findActiveKey.mockResolvedValue(null);

    await expect(usecase.execute(input)).rejects.toBeInstanceOf(
      ApiKeyNotFoundError,
    );
  });
});
