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
  const merchantRepository = { findOwnedByUser: vi.fn() };
  const apiKeyRepo = { findActiveKey: vi.fn(), create: vi.fn() };
  const usecase = new GenerateApiKeyUsecase(
    merchantRepository as never,
    apiKeyRepo as never,
  );

  const input = {
    userId: "user-1",
    merchantId: "merchant-1",
    environment: "LIVE" as const,
  };

  const merchant = {
    id: "merchant-1",
    mid: "mid-1",
    userId: "user-1",
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
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
    merchantRepository.findOwnedByUser.mockResolvedValue(merchant);
    apiKeyRepo.findActiveKey.mockResolvedValue(null);
    mocks.generateApiKey.mockReturnValue({
      keyId: "payvo_live_key123",
      keySecret: "secret_123",
    });
    mocks.hashKeySecret.mockReturnValue("hash-secret-123");
    apiKeyRepo.create.mockResolvedValue(createdApiKey);
  });

  it("successfully generates a new api key and returns plain secret", async () => {
    const result = await usecase.execute(input);

    expect(merchantRepository.findOwnedByUser).toHaveBeenCalledWith({
      merchantId: "merchant-1",
      userId: "user-1",
    });
    expect(apiKeyRepo.findActiveKey).toHaveBeenCalledWith({
      merchantId: "merchant-1",
      environment: "LIVE",
    });
    expect(mocks.generateApiKey).toHaveBeenCalledWith("LIVE");
    expect(mocks.hashKeySecret).toHaveBeenCalledWith("secret_123");
    expect(apiKeyRepo.create).toHaveBeenCalledWith({
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

  it("throws MerchantNotFoundError when merchant does not exist for the user", async () => {
    merchantRepository.findOwnedByUser.mockResolvedValue(null);

    await expect(usecase.execute(input)).rejects.toBeInstanceOf(
      MerchantNotFoundError,
    );
    expect(apiKeyRepo.findActiveKey).not.toHaveBeenCalled();
    expect(apiKeyRepo.create).not.toHaveBeenCalled();
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
    expect(apiKeyRepo.create).not.toHaveBeenCalled();
  });

  it("throws ApiKeyAlreadyExistsError when an active key exists for the merchant & environment", async () => {
    apiKeyRepo.findActiveKey.mockResolvedValue(createdApiKey);

    await expect(usecase.execute(input)).rejects.toBeInstanceOf(
      ApiKeyAlreadyExistsError,
    );
    expect(apiKeyRepo.create).not.toHaveBeenCalled();
  });
});
