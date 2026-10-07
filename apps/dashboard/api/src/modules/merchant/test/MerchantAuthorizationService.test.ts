import { beforeEach, describe, expect, it, vi } from "vitest";
import MerchantAuthorizationService from "../application/merchant-authorization.service.js";
import {
  MerchantInactiveError,
  MerchantNotFoundError,
} from "../error/merchant.errors.js";

describe("MerchantAuthorizationService", () => {
  const merchantCache = {
    getCachedMerchant: vi.fn(),
  };
  const service = new MerchantAuthorizationService(merchantCache as never);

  const activeMerchant = {
    id: "merchant-1",
    mid: "mid-1",
    isActive: true,
    userId: "user-1",
  };

  const inactiveMerchant = {
    ...activeMerchant,
    isActive: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("requireActiveMerchant", () => {
    it("returns active merchant if found and active", async () => {
      merchantCache.getCachedMerchant.mockResolvedValue(activeMerchant);

      const result = await service.requireActiveMerchant("merchant-1");

      expect(merchantCache.getCachedMerchant).toHaveBeenCalledWith("merchant-1");
      expect(result).toEqual(activeMerchant);
    });

    it("throws MerchantNotFoundError if merchant does not exist", async () => {
      merchantCache.getCachedMerchant.mockResolvedValue(null);

      await expect(service.requireActiveMerchant("merchant-1")).rejects.toBeInstanceOf(
        MerchantNotFoundError,
      );
    });

    it("throws MerchantInactiveError if merchant is inactive", async () => {
      merchantCache.getCachedMerchant.mockResolvedValue(inactiveMerchant);

      await expect(service.requireActiveMerchant("merchant-1")).rejects.toBeInstanceOf(
        MerchantInactiveError,
      );
    });
  });

  describe("requireOwnedActiveMerchant", () => {
    it("returns active merchant when found, owned, and active", async () => {
      merchantCache.getCachedMerchant.mockResolvedValue(activeMerchant);

      const result = await service.requireOwnedActiveMerchant("merchant-1", "user-1");

      expect(merchantCache.getCachedMerchant).toHaveBeenCalledWith("merchant-1");
      expect(result).toEqual(activeMerchant);
    });

    it("throws MerchantNotFoundError if merchant is not found", async () => {
      merchantCache.getCachedMerchant.mockResolvedValue(null);

      await expect(
        service.requireOwnedActiveMerchant("merchant-1", "user-1"),
      ).rejects.toBeInstanceOf(MerchantNotFoundError);
    });

    it("throws MerchantNotFoundError if merchant is owned by different user", async () => {
      merchantCache.getCachedMerchant.mockResolvedValue(activeMerchant);

      await expect(
        service.requireOwnedActiveMerchant("merchant-1", "other-user"),
      ).rejects.toBeInstanceOf(MerchantNotFoundError);
    });

    it("throws MerchantInactiveError if merchant is inactive", async () => {
      merchantCache.getCachedMerchant.mockResolvedValue(inactiveMerchant);

      await expect(
        service.requireOwnedActiveMerchant("merchant-1", "user-1"),
      ).rejects.toBeInstanceOf(MerchantInactiveError);
    });

    it("uses custom error messages when provided", async () => {
      merchantCache.getCachedMerchant.mockResolvedValue(inactiveMerchant);

      await expect(
        service.requireOwnedActiveMerchant("merchant-1", "user-1", {
          inactiveMessage: "Custom inactive message",
          notFoundMessage: "Custom not found message",
        }),
      ).rejects.toThrow("Custom inactive message");
    });
  });

  describe("requireOwnedMerchant", () => {
    it("returns merchant when found and owned even if inactive", async () => {
      merchantCache.getCachedMerchant.mockResolvedValue(inactiveMerchant);

      const result = await service.requireOwnedMerchant("merchant-1", "user-1");

      expect(result).toEqual(inactiveMerchant);
    });

    it("throws MerchantNotFoundError if not owned by user", async () => {
      merchantCache.getCachedMerchant.mockResolvedValue(activeMerchant);

      await expect(
        service.requireOwnedMerchant("merchant-1", "different-user"),
      ).rejects.toBeInstanceOf(MerchantNotFoundError);
    });
  });

  describe("requireMerchant", () => {
    it("returns merchant when found", async () => {
      merchantCache.getCachedMerchant.mockResolvedValue(activeMerchant);

      const result = await service.requireMerchant("merchant-1");

      expect(result).toEqual(activeMerchant);
    });

    it("throws MerchantNotFoundError if not found", async () => {
      merchantCache.getCachedMerchant.mockResolvedValue(null);

      await expect(service.requireMerchant("merchant-1")).rejects.toBeInstanceOf(
        MerchantNotFoundError,
      );
    });
  });
});
