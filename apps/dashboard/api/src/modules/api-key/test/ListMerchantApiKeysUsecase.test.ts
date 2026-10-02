import { beforeEach, describe, expect, it, vi } from "vitest";
import ListMerchantApiKeysUsecase from "../application/usecase/ListMerchantApiKeysUsecase.js";
import {
  MerchantInactiveError,
  MerchantNotFoundError,
} from "@/modules/merchant/error/merchant.errors.js";

describe("ListMerchantApiKeysUsecase", () => {
  const apiKeyRepository = { findByMerchantId: vi.fn() };
  const merchantAuthorizationService = {
    requireOwnedActiveMerchant: vi.fn(),
  };
  const usecase = new ListMerchantApiKeysUsecase(
    apiKeyRepository as never,
    merchantAuthorizationService as never,
  );

  const input = {
    userId: "user-1",
    merchantId: "merchant-1",
  };

  const apiKeys = [
    {
      id: "key-1",
      merchantId: "merchant-1",
      keyId: "payvo_test_key",
      secretHash: "hashed-secret",
      environment: "TEST" as const,
      status: "ACTIVE" as const,
      graceEndsAt: null,
      revokedAt: null,
      lastUsedAt: new Date("2026-01-01T00:00:00.000Z"),
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: "key-2",
      merchantId: "merchant-1",
      keyId: "payvo_live_key",
      secretHash: "another-hashed-secret",
      environment: "LIVE" as const,
      status: "GRACE_PERIOD" as const,
      graceEndsAt: new Date("2026-01-02T00:00:00.000Z"),
      revokedAt: null,
      lastUsedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    merchantAuthorizationService.requireOwnedActiveMerchant.mockResolvedValue(
      undefined,
    );
    apiKeyRepository.findByMerchantId.mockResolvedValue(apiKeys);
  });

  it("returns the merchant's keys without exposing key material", async () => {
    const result = await usecase.execute(input);

    expect(
      merchantAuthorizationService.requireOwnedActiveMerchant,
    ).toHaveBeenCalledWith("merchant-1", "user-1", {
      inactiveMessage: "Inactive merchant cannot perform api key operations",
      notFoundMessage: "Merchant not found",
    });
    expect(apiKeyRepository.findByMerchantId).toHaveBeenCalledWith(
      "merchant-1",
    );
    expect(result).toEqual({
      merchantId: "merchant-1",
      apiKeys: [
        {
          id: "key-1",
          status: "ACTIVE",
          environment: "TEST",
          graceEndsAt: null,
          revokedAt: null,
          lastUsedAt: apiKeys[0]!.lastUsedAt,
        },
        {
          id: "key-2",
          status: "GRACE_PERIOD",
          environment: "LIVE",
          graceEndsAt: apiKeys[1]!.graceEndsAt,
          revokedAt: null,
          lastUsedAt: null,
        },
      ],
    });
    expect(result.apiKeys[0]).not.toHaveProperty("keyId");
    expect(result.apiKeys[0]).not.toHaveProperty("secretHash");
  });

  it("returns an empty list when the merchant has no API keys", async () => {
    apiKeyRepository.findByMerchantId.mockResolvedValue([]);

    await expect(usecase.execute(input)).resolves.toEqual({
      merchantId: "merchant-1",
      apiKeys: [],
    });
  });

  it("does not list keys when the merchant is not found or owned", async () => {
    merchantAuthorizationService.requireOwnedActiveMerchant.mockRejectedValue(
      new MerchantNotFoundError(),
    );

    await expect(usecase.execute(input)).rejects.toBeInstanceOf(
      MerchantNotFoundError,
    );
    expect(apiKeyRepository.findByMerchantId).not.toHaveBeenCalled();
  });

  it("does not list keys when the merchant is inactive", async () => {
    merchantAuthorizationService.requireOwnedActiveMerchant.mockRejectedValue(
      new MerchantInactiveError(),
    );

    await expect(usecase.execute(input)).rejects.toBeInstanceOf(
      MerchantInactiveError,
    );
    expect(apiKeyRepository.findByMerchantId).not.toHaveBeenCalled();
  });
});
