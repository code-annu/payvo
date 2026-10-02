import { beforeEach, describe, expect, it, vi } from "vitest";
import GenerateApiKeyUsecase from "../application/usecase/GenerateApiKeyUsecase.js";
import { ApiKeyAlreadyExistsError } from "../error/api-key.errors.js";
import {
  MerchantInactiveError,
  MerchantNotFoundError,
} from "@/modules/merchant/error/merchant.errors.js";

const mocks = vi.hoisted(() => ({
  generateApiKey: vi.fn(),
  hashKeySecret: vi.fn(),
}));

vi.mock("@payvo/shared/api-key", () => ({
  generateApiKey: mocks.generateApiKey,
  hashKeySecret: mocks.hashKeySecret,
}));

describe("GenerateApiKeyUsecase", () => {
  const apiKeyRepository = { findActiveKey: vi.fn(), create: vi.fn() };
  const merchantAuthorizationService = {
    requireOwnedActiveMerchant: vi.fn(),
  };
  const usecase = new GenerateApiKeyUsecase(
    apiKeyRepository as never,
    merchantAuthorizationService as never,
  );

  const input = {
    userId: "user-1",
    merchantId: "merchant-1",
    environment: "LIVE" as const,
  };

  const createdApiKey = {
    id: "key-uuid-1",
    merchantId: "merchant-1",
    keyId: "payvo_live_key123",
    secretHash: "hash-secret-123",
    environment: "LIVE" as const,
    status: "ACTIVE" as const,
    graceEndsAt: null,
    revokedAt: null,
    lastUsedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    merchantAuthorizationService.requireOwnedActiveMerchant.mockResolvedValue(
      undefined,
    );
    apiKeyRepository.findActiveKey.mockResolvedValue(null);
    mocks.generateApiKey.mockReturnValue({
      keyId: "payvo_live_key123",
      keySecret: "secret_123",
    });
    mocks.hashKeySecret.mockReturnValue("hash-secret-123");
    apiKeyRepository.create.mockResolvedValue(createdApiKey);
  });

  it("creates the key and returns its plaintext secret once", async () => {
    const result = await usecase.execute(input);

    expect(
      merchantAuthorizationService.requireOwnedActiveMerchant,
    ).toHaveBeenCalledWith("merchant-1", "user-1", {
      inactiveMessage: "Inactive merchant cannot perform api key operations",
      notFoundMessage: "Merchant not found",
    });
    expect(apiKeyRepository.findActiveKey).toHaveBeenCalledWith({
      merchantId: "merchant-1",
      environment: "LIVE",
    });
    expect(mocks.generateApiKey).toHaveBeenCalledWith("LIVE");
    expect(mocks.hashKeySecret).toHaveBeenCalledWith("secret_123");
    expect(apiKeyRepository.create).toHaveBeenCalledWith({
      merchantId: "merchant-1",
      keyId: "payvo_live_key123",
      secretHash: "hash-secret-123",
      environment: "LIVE",
    });
    expect(result).toEqual({
      id: createdApiKey.id,
      keyId: "payvo_live_key123",
      keySecret: "secret_123",
      status: "ACTIVE",
      environment: "LIVE",
      generatedAt: createdApiKey.createdAt,
    });
  });

  it("does not access keys when the merchant is not found or owned", async () => {
    merchantAuthorizationService.requireOwnedActiveMerchant.mockRejectedValue(
      new MerchantNotFoundError(),
    );

    await expect(usecase.execute(input)).rejects.toBeInstanceOf(
      MerchantNotFoundError,
    );
    expect(apiKeyRepository.findActiveKey).not.toHaveBeenCalled();
    expect(apiKeyRepository.create).not.toHaveBeenCalled();
  });

  it("does not access keys when the merchant is inactive", async () => {
    merchantAuthorizationService.requireOwnedActiveMerchant.mockRejectedValue(
      new MerchantInactiveError(),
    );

    await expect(usecase.execute(input)).rejects.toBeInstanceOf(
      MerchantInactiveError,
    );
    expect(apiKeyRepository.findActiveKey).not.toHaveBeenCalled();
    expect(apiKeyRepository.create).not.toHaveBeenCalled();
  });

  it("throws when an active key already exists for the merchant and environment", async () => {
    apiKeyRepository.findActiveKey.mockResolvedValue(createdApiKey);

    await expect(usecase.execute(input)).rejects.toBeInstanceOf(
      ApiKeyAlreadyExistsError,
    );
    expect(apiKeyRepository.create).not.toHaveBeenCalled();
  });
});
