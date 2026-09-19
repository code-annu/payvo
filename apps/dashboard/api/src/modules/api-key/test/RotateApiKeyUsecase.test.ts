import { beforeEach, describe, expect, it, vi } from "vitest";
import RotateApiKeyUsecase from "../application/usecase/RotateApiKeyUsecase.js";
import { ApiKeyNotFoundError } from "../error/api-key.errors.js";
import {
  MerchantInactiveError,
  MerchantNotFoundError,
} from "@/modules/merchant/error/merchant.errors.js";

const mocks = vi.hoisted(() => ({
  generateApiKey: vi.fn(),
  hashKeySecret: vi.fn(),
  dbTransaction: vi.fn(),
}));

vi.mock("@payvo/shared/api-key", () => ({
  generateApiKey: mocks.generateApiKey,
  hashKeySecret: mocks.hashKeySecret,
}));

vi.mock("@payvo/database/client", () => ({
  dbTransaction: mocks.dbTransaction,
}));

describe("RotateApiKeyUsecase", () => {
  const merchantRepository = { findOwnedByUser: vi.fn() };
  const apiKeyRepo = { revokeKeyForRotation: vi.fn(), create: vi.fn() };
  const usecase = new RotateApiKeyUsecase(
    merchantRepository as never,
    apiKeyRepo as never,
  );

  const merchant = {
    id: "merchant-1",
    mid: "mid-1",
    userId: "user-1",
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const oldApiKey = {
    id: "old-key-1",
    merchantId: "merchant-1",
    keyId: "payvo_live_oldkey",
    secretHash: "old-hash",
    environment: "LIVE" as const,
    status: "ACTIVE" as const,
    graceEndsAt: null,
    revokedAt: null,
    lastUsedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const newApiKey = {
    id: "new-key-1",
    merchantId: "merchant-1",
    keyId: "payvo_live_newkey",
    secretHash: "new-hash",
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
    mocks.generateApiKey.mockReturnValue({
      keyId: "payvo_live_newkey",
      keySecret: "new-secret-plain",
    });
    mocks.hashKeySecret.mockReturnValue("new-hash");
    mocks.dbTransaction.mockImplementation(async (callback: any) =>
      callback({}),
    );
    apiKeyRepo.revokeKeyForRotation.mockResolvedValue(oldApiKey);
    apiKeyRepo.create.mockResolvedValue(newApiKey);
  });

  it("rotates api key with IMMEDIATELY strategy", async () => {
    const result = await usecase.execute({
      userId: "user-1",
      merchantId: "merchant-1",
      oldKeyRevokeStrategy: "IMMEDIATELY",
      environment: "LIVE",
    });

    expect(merchantRepository.findOwnedByUser).toHaveBeenCalledWith({
      merchantId: "merchant-1",
      userId: "user-1",
    });
    expect(mocks.generateApiKey).toHaveBeenCalledWith("LIVE");
    expect(mocks.hashKeySecret).toHaveBeenCalledWith("new-secret-plain");
    expect(apiKeyRepo.revokeKeyForRotation).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        merchantId: "merchant-1",
        revokeAt: expect.any(Date),
      }),
    );
    expect(apiKeyRepo.create).toHaveBeenCalledWith(
      {
        merchantId: "merchant-1",
        keyId: "payvo_live_newkey",
        secretHash: "new-hash",
        environment: "LIVE",
      },
      expect.anything(),
    );
    expect(result).toEqual({
      id: newApiKey.id,
      keyId: "payvo_live_newkey",
      keySecret: "new-secret-plain",
      status: "ACTIVE",
      environment: "LIVE",
      generatedAt: newApiKey.createdAt,
    });
  });

  it("rotates api key with 24_HOURS strategy", async () => {
    const result = await usecase.execute({
      userId: "user-1",
      merchantId: "merchant-1",
      oldKeyRevokeStrategy: "24_HOURS",
      environment: "LIVE",
    });

    expect(apiKeyRepo.revokeKeyForRotation).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        merchantId: "merchant-1",
        revokeAt: expect.any(Date),
      }),
    );
    expect(result.keyId).toBe("payvo_live_newkey");
  });

  it("throws MerchantNotFoundError when merchant does not exist for the user", async () => {
    merchantRepository.findOwnedByUser.mockResolvedValue(null);

    await expect(
      usecase.execute({
        userId: "user-1",
        merchantId: "merchant-1",
        oldKeyRevokeStrategy: "IMMEDIATELY",
        environment: "LIVE",
      }),
    ).rejects.toBeInstanceOf(MerchantNotFoundError);

    expect(mocks.dbTransaction).not.toHaveBeenCalled();
  });

  it("throws MerchantInactiveError when merchant is inactive", async () => {
    merchantRepository.findOwnedByUser.mockResolvedValue({
      ...merchant,
      isActive: false,
    });

    await expect(
      usecase.execute({
        userId: "user-1",
        merchantId: "merchant-1",
        oldKeyRevokeStrategy: "IMMEDIATELY",
        environment: "LIVE",
      }),
    ).rejects.toBeInstanceOf(MerchantInactiveError);

    expect(mocks.dbTransaction).not.toHaveBeenCalled();
  });

  it("throws ApiKeyNotFoundError when no active key exists to rotate", async () => {
    apiKeyRepo.revokeKeyForRotation.mockResolvedValue(null);

    await expect(
      usecase.execute({
        userId: "user-1",
        merchantId: "merchant-1",
        oldKeyRevokeStrategy: "IMMEDIATELY",
        environment: "LIVE",
      }),
    ).rejects.toBeInstanceOf(ApiKeyNotFoundError);

    expect(apiKeyRepo.create).not.toHaveBeenCalled();
  });
});
