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
  const merchantAuthorizationService = {
    requireOwnedActiveMerchant: vi.fn(),
  };
  const apiKeyRepository = { revokeKeyForRotation: vi.fn(), create: vi.fn() };
  const usecase = new RotateApiKeyUsecase(
    apiKeyRepository as never,
    merchantAuthorizationService as never,
  );

  const input = {
    userId: "user-1",
    merchantId: "merchant-1",
    oldKeyRevokeStrategy: "IMMEDIATELY" as const,
    environment: "LIVE" as const,
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
    merchantAuthorizationService.requireOwnedActiveMerchant.mockResolvedValue(
      undefined,
    );
    mocks.generateApiKey.mockReturnValue({
      keyId: "payvo_live_newkey",
      keySecret: "new-secret-plain",
    });
    mocks.hashKeySecret.mockReturnValue("new-hash");
    mocks.dbTransaction.mockImplementation(async (callback: any) =>
      callback({}),
    );
    apiKeyRepository.revokeKeyForRotation.mockResolvedValue(oldApiKey);
    apiKeyRepository.create.mockResolvedValue(newApiKey);
  });

  it("rotates an API key immediately within a transaction", async () => {
    const result = await usecase.execute(input);

    expect(
      merchantAuthorizationService.requireOwnedActiveMerchant,
    ).toHaveBeenCalledWith("merchant-1", "user-1", {
      inactiveMessage: "Inactive merchant cannot perform api key operations",
      notFoundMessage: "Merchant not found",
    });
    expect(mocks.generateApiKey).toHaveBeenCalledWith("LIVE");
    expect(mocks.hashKeySecret).toHaveBeenCalledWith("new-secret-plain");
    expect(apiKeyRepository.revokeKeyForRotation).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        merchantId: "merchant-1",
        revokeAt: expect.any(Date),
      }),
    );
    expect(apiKeyRepository.create).toHaveBeenCalledWith(
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

  it("sets the old key revocation time 24 hours ahead", async () => {
    const beforeRotation = Date.now();
    await usecase.execute({
      ...input,
      oldKeyRevokeStrategy: "24_HOURS",
    });
    const afterRotation = Date.now();
    const revokeAt = apiKeyRepository.revokeKeyForRotation.mock.calls[0]![1]
      .revokeAt as Date;

    expect(revokeAt.getTime()).toBeGreaterThanOrEqual(
      beforeRotation + 24 * 60 * 60 * 1000,
    );
    expect(revokeAt.getTime()).toBeLessThanOrEqual(
      afterRotation + 24 * 60 * 60 * 1000,
    );
  });

  it("does not rotate when the merchant is not found or owned", async () => {
    merchantAuthorizationService.requireOwnedActiveMerchant.mockRejectedValue(
      new MerchantNotFoundError(),
    );

    await expect(usecase.execute(input)).rejects.toBeInstanceOf(
      MerchantNotFoundError,
    );
    expect(mocks.dbTransaction).not.toHaveBeenCalled();
  });

  it("does not rotate when the merchant is inactive", async () => {
    merchantAuthorizationService.requireOwnedActiveMerchant.mockRejectedValue(
      new MerchantInactiveError(),
    );

    await expect(usecase.execute(input)).rejects.toBeInstanceOf(
      MerchantInactiveError,
    );
    expect(mocks.dbTransaction).not.toHaveBeenCalled();
  });

  it("throws ApiKeyNotFoundError when no active key can be rotated", async () => {
    apiKeyRepository.revokeKeyForRotation.mockResolvedValue(null);

    await expect(usecase.execute(input)).rejects.toBeInstanceOf(
      ApiKeyNotFoundError,
    );
    expect(apiKeyRepository.create).not.toHaveBeenCalled();
  });
});
