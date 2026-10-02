import TYPES from "@/core/di/inversify.types.js";
import { inject, injectable } from "inversify";
import MerchantRepository from "../repository/merchant.repository.js";
import { Merchant } from "../entity/merchant.entity.js";
import {
  MerchantInactiveError,
  MerchantNotFoundError,
} from "../error/merchant.errors.js";

@injectable()
export default class MerchantAuthorizationService {
  constructor(
    @inject(TYPES.MerchantRepository)
    private readonly merchantRepo: MerchantRepository,
  ) {}

  async requireActiveMerchant(merchantId: string): Promise<Merchant> {
    const merchant = await this.merchantRepo.findById(merchantId);
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
  ): Promise<Merchant> {
    const merchant = await this.merchantRepo.findOwnedByUser({
      merchantId,
      userId,
    });
    if (!merchant) throw new MerchantNotFoundError(error?.notFoundMessage);
    if (!merchant.isActive)
      throw new MerchantInactiveError(error?.inactiveMessage);
    return merchant;
  }

  async requireOwnedMerchant(
    merchantId: string,
    userId: string,
  ): Promise<Merchant> {
    const merchant = await this.merchantRepo.findOwnedByUser({
      merchantId,
      userId,
    });
    if (!merchant) throw new MerchantNotFoundError();
    return merchant;
  }

  async requireMerchant(merchantId: string): Promise<Merchant> {
    const merchant = await this.merchantRepo.findById(merchantId);
    if (!merchant) throw new MerchantNotFoundError();
    return merchant;
  }
}
