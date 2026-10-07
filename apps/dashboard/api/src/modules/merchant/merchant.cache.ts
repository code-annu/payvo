import TYPES from "@/core/di/inversify.types.js";
import { injectable, inject } from "inversify";
import MerchantRepository from "./repository/merchant.repository.js";
import { deleteCache, getCache, setCache } from "@payvo/redis/cache";

export interface CachedMerchant {
  readonly id: string;
  readonly mid: string;
  readonly isActive: boolean;
  readonly userId: string;
}

function merchantKey(merchantId: string) {
  return `merchant:cache:${merchantId}`;
}

@injectable()
export default class MerchantCache {
  constructor(
    @inject(TYPES.MerchantRepository)
    private readonly merchantRepo: MerchantRepository,
  ) {}

  async getCachedMerchant(merchantId: string): Promise<CachedMerchant | null> {
    let cachedMerchant = await getCache<CachedMerchant>(
      merchantKey(merchantId),
    );
    if (!cachedMerchant) {
      const merchant = await this.merchantRepo.findById(merchantId);
      if (!merchant) return null;

      cachedMerchant = {
        id: merchant.id,
        mid: merchant.mid,
        isActive: merchant.isActive,
        userId: merchant.userId,
      };
      setCache<CachedMerchant>({
        key: merchantKey(merchantId),
        value: cachedMerchant,
        ttlSeconds: 5 * 60,
      });
    }
    return cachedMerchant;
  }

  async invalidateMerchantCache(merchantId: string): Promise<void> {
    return deleteCache(merchantKey(merchantId));
  }

  async invalidateMerchantsCacheByUserId(
    userId: string,
  ): Promise<{ merchantIds: string[] }> {
    const { merchants } = await this.merchantRepo.findByUser(userId);
    await Promise.all(
      merchants.map(({ id }) => this.invalidateMerchantCache(id)),
    );
    return { merchantIds: merchants.map(({ id }) => id) };
  }
}
