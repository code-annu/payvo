import TYPES from "@/core/di/inversify.types.js";
import { inject, injectable } from "inversify";
import MerchantCache, { CachedMerchant } from "../merchant.cache.js";
import {
  MerchantInactiveError,
  MerchantNotFoundError,
} from "../error/merchant.errors.js";

@injectable()
export default class MerchantAuthorizationService {
  constructor(
    @inject(TYPES.MerchantCache)
    private readonly merchantCache: MerchantCache,
  ) {}

  async requireActiveMerchant(merchantId: string): Promise<CachedMerchant> {
    const merchant = await this.merchantCache.getCachedMerchant(merchantId);
    if (!merchant) throw new MerchantNotFoundError();
    if (!merchant.isActive) throw new MerchantInactiveError();
    return merchant;
  }

  async requireOwnedActiveMerchant(
    merchantId: string,
    userId: string,
    error?: {
      inactiveMessage?: string;
      notFoundMessage?: string;
    },
  ): Promise<CachedMerchant> {
    const merchant = await this.merchantCache.getCachedMerchant(merchantId);
    if (!merchant || merchant.userId !== userId)
      throw new MerchantNotFoundError(error?.notFoundMessage);
    if (!merchant.isActive)
      throw new MerchantInactiveError(error?.inactiveMessage);
    return merchant;
  }

  async requireOwnedMerchant(
    merchantId: string,
    userId: string,
  ): Promise<CachedMerchant> {
    const merchant = await this.merchantCache.getCachedMerchant(merchantId);
    if (!merchant || merchant.userId !== userId)
      throw new MerchantNotFoundError();
    return merchant;
  }

  async requireMerchant(merchantId: string): Promise<CachedMerchant> {
    const merchant = await this.merchantCache.getCachedMerchant(merchantId);
    if (!merchant) throw new MerchantNotFoundError();
    return merchant;
  }
}
