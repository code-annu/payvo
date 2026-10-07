import { beforeEach, describe, expect, it, vi } from "vitest";
import MerchantCache from "../merchant.cache.js";

const mocks = vi.hoisted(() => ({
  getCache: vi.fn(),
  setCache: vi.fn(),
  deleteCache: vi.fn(),
}));

vi.mock("@payvo/redis/cache", () => ({
  getCache: mocks.getCache,
  setCache: mocks.setCache,
  deleteCache: mocks.deleteCache,
}));

describe("MerchantCache", () => {
  const merchantRepo = { findById: vi.fn() };
  const merchantCache = new MerchantCache(merchantRepo as never);

  const cachedMerchant = {
    id: "merchant-1",
    mid: "mid-1",
    isActive: true,
    userId: "user-1",
  };

  const dbMerchant = {
    ...cachedMerchant,
    createdAt: new Date("2026-01-01"),
    updatedAt: new Date("2026-01-01"),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getCachedMerchant", () => {
    it("returns cached merchant if found in redis", async () => {
      mocks.getCache.mockResolvedValue(cachedMerchant);

      const result = await merchantCache.getCachedMerchant("merchant-1");

      expect(mocks.getCache).toHaveBeenCalledWith("merchant:cache:merchant-1");
      expect(merchantRepo.findById).not.toHaveBeenCalled();
      expect(result).toEqual(cachedMerchant);
    });

    it("fetches from repo and sets cache if cache missed", async () => {
      mocks.getCache.mockResolvedValue(null);
      merchantRepo.findById.mockResolvedValue(dbMerchant);

      const result = await merchantCache.getCachedMerchant("merchant-1");

      expect(mocks.getCache).toHaveBeenCalledWith("merchant:cache:merchant-1");
      expect(merchantRepo.findById).toHaveBeenCalledWith("merchant-1");
      expect(mocks.setCache).toHaveBeenCalledWith({
        key: "merchant:cache:merchant-1",
        value: cachedMerchant,
        ttlSeconds: 300,
      });
      expect(result).toEqual(cachedMerchant);
    });

    it("returns null if not in cache and not found in repo", async () => {
      mocks.getCache.mockResolvedValue(null);
      merchantRepo.findById.mockResolvedValue(null);

      const result = await merchantCache.getCachedMerchant("merchant-1");

      expect(result).toBeNull();
      expect(mocks.setCache).not.toHaveBeenCalled();
    });
  });

  describe("invalidateMerchantCache", () => {
    it("deletes merchant cache key from redis", async () => {
      mocks.deleteCache.mockResolvedValue(undefined);

      await merchantCache.invalidateMerchantCache("merchant-1");

      expect(mocks.deleteCache).toHaveBeenCalledWith("merchant:cache:merchant-1");
    });
  });
});
