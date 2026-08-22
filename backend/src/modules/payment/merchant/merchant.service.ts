import { inject, injectable } from "inversify";
import TYPES from "@/core/di/inversify.types";
import {
  MerchantNotFoundError,
  MerchantAccessDeniedError,
} from "./merchant.errors";
import MerchantRepository from "./repository/merchant.repository";

@injectable()
export default class MerchantService {
  constructor(
    @inject(TYPES.MerchantRepository)
    private readonly merchantRepo: MerchantRepository,
  ) {}

  async createMerchant(userId: string) {
    const merchant = await this.merchantRepo.create({ userId });
    return { merchant };
  }

  async getMerchant(userId: string, merchantId: string) {
    const merchant = await this.merchantRepo.findById(merchantId);
    if (!merchant) {
      throw new MerchantNotFoundError();
    }
    if (merchant.userId !== userId) {
      throw new MerchantAccessDeniedError();
    }
    return { merchant };
  }

  async deleteMerchant(userId: string, merchantId: string) {
    const merchant = await this.merchantRepo.findById(merchantId);
    if (!merchant) {
      throw new MerchantNotFoundError();
    }
    if (merchant.userId !== userId) {
      throw new MerchantAccessDeniedError();
    }

    await this.merchantRepo.delete(merchantId);
  }

  async getUserMerchants(userId: string) {
    const merchants = await this.merchantRepo.findByUserId(userId);
    return { merchants };
  }
}
