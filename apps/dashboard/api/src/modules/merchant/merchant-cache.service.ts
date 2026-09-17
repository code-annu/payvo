import TYPES from "@/core/di/inversify.types.js";
import { inject, injectable } from "inversify";
import MerchantRepository from "./repository/merchant.repository.js";
import { redisClient } from "@payvo/redis";

export interface CachedMerchant {
  readonly id: string;
  readonly userId: string;
  readonly isActive: boolean;
}

function merchantKey(merchantId: string) {
  return `merchant:${merchantId}`;
}

@injectable()
export default class MerchantCacheService {
  constructor(
    @inject(TYPES.MerchantRepository)
    private readonly merchantRepo: MerchantRepository,
  ) {}

  async getCachedMerchant(merchantId: string): Promise<CachedMerchant | null> {
    const key = merchantKey(merchantId);
    try {
      const value = await redisClient.get(key);
      if (value) {
        return JSON.parse(value) as CachedMerchant;
      }
    } catch (err) {
      console.log(err);
    }

    const merchant = await this.merchantRepo.findById(merchantId);
    if (!merchant) return null;
    try {
      const cachedMerchant: CachedMerchant = {
        id: merchant.id,
        userId: merchant.userId,
        isActive: merchant.isActive,
      };
      await redisClient.set(key, JSON.stringify(cachedMerchant));
      return cachedMerchant;
    } catch (err) {
      console.log(err);
      return null;
    }
  }

  async invalidateCachedMerchant(merchantId: string) {
    try {
      const key = merchantKey(merchantId);
      await redisClient.del(key);
    } catch (err) {
      console.log(err);
    }
  }
}
