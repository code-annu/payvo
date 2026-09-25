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
  const merchantRepository = { findOwnedByUser: vi.fn() };
  const apiKeyRepo = { findById: vi.fn(), revokeById: vi.fn() };
  const usecase = new RevokeApiKeyUsecase(
    merchantRepository as never,
    apiKeyRepo as never,
  );

  const input = {
    apiKeyId: "key-uuid-1",
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

  const activeMerchant = {
    id: "merchant-1",
    mid: "mid-1",
    userId: "user-1",
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    apiKeyRepo.findById.mockResolvedValue(activeApiKey);
    merchantRepository.findOwnedByUser.mockResolvedValue(activeMerchant);
    apiKeyRepo.revokeById.mockResolvedValue(revokedApiKey);
  });

  it("successfully revokes an active api key and returns its details", async () => {
    const result = await usecase.execute(input);

    expect(apiKeyRepo.findById).toHaveBeenCalledWith("key-uuid-1");
    expect(merchantRepository.findOwnedByUser).toHaveBeenCalledWith({
      merchantId: "merchant-1",
      userId: "user-1",
    });
    expect(apiKeyRepo.revokeById).toHaveBeenCalledWith("key-uuid-1");
    expect(result).toEqual({
      id: revokedApiKey.id,
      keyId: revokedApiKey.keyId,
      status: "REVOKED",
      environment: "LIVE",
      revokedAt: revokedApiKey.revokedAt,
    });
  });

  it("throws ApiKeyNotFoundError when api key does not exist", async () => {
    apiKeyRepo.findById.mockResolvedValue(null);

    await expect(usecase.execute(input)).rejects.toBeInstanceOf(
      ApiKeyNotFoundError,
    );
    expect(apiKeyRepo.findById).toHaveBeenCalledWith("key-uuid-1");
    expect(merchantRepository.findOwnedByUser).not.toHaveBeenCalled();
    expect(apiKeyRepo.revokeById).not.toHaveBeenCalled();
  });

  it("throws ApiKeyAlreadyRevokedError when api key is already revoked", async () => {
    apiKeyRepo.findById.mockResolvedValue({
      ...activeApiKey,
      status: "REVOKED",
      revokedAt: new Date(),
    });

    await expect(usecase.execute(input)).rejects.toBeInstanceOf(
      RevokedApiKeyError,
    );
    expect(merchantRepository.findOwnedByUser).not.toHaveBeenCalled();
    expect(apiKeyRepo.revokeById).not.toHaveBeenCalled();
  });

  it("throws MerchantNotFoundError when user does not own the merchant", async () => {
    merchantRepository.findOwnedByUser.mockResolvedValue(null);

    await expect(usecase.execute(input)).rejects.toBeInstanceOf(
      MerchantNotFoundError,
    );
    expect(merchantRepository.findOwnedByUser).toHaveBeenCalledWith({
      merchantId: "merchant-1",
      userId: "user-1",
    });
    expect(apiKeyRepo.revokeById).not.toHaveBeenCalled();
  });

  it("throws MerchantInactiveError when merchant is not active", async () => {
    merchantRepository.findOwnedByUser.mockResolvedValue({
      ...activeMerchant,
      isActive: false,
    });

    await expect(usecase.execute(input)).rejects.toBeInstanceOf(
      MerchantInactiveError,
    );
    expect(apiKeyRepo.revokeById).not.toHaveBeenCalled();
  });

  it("throws ApiKeyAlreadyRevokedError when concurrent revoke occurs and revokeById returns null", async () => {
    apiKeyRepo.revokeById.mockResolvedValue(null);

    await expect(usecase.execute(input)).rejects.toBeInstanceOf(
      RevokedApiKeyError,
    );
  });
});
