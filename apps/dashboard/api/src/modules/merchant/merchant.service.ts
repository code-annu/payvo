import TYPES from "@/core/di/inversify.types.js";
import { inject, injectable } from "inversify";
import MerchantRepository from "./repository/merchant.repository.js";
import { MerchantNotFoundError } from "./error/merchant.errors.js";
import { Merchant } from "./entity/merchant.entity.js";
import { generateRandomKey } from "@payvo/shared/random";
import StringUtil from "@/core/util/string.util.js";

@injectable()
export default class MerchantService {
  constructor(
    @inject(TYPES.MerchantRepository)
    private readonly merchantRepo: MerchantRepository,
    @inject(TYPES.StringUtil)
    private readonly stringUtil: StringUtil,
  ) {}

  async getUserMerchants(userId: string): Promise<Merchant[]> {
    return await this.merchantRepo.findMerchantsByUserId(userId);
  }

  async createMerchant(userId: string): Promise<Merchant> {
    let mid = generateRandomKey();
    do {
      mid = generateRandomKey();
    } while (
      (await this.merchantRepo.findMerchantByMid(mid)) ||
      !this.stringUtil.isAlphanumeric(mid)
    );
    return await this.merchantRepo.createMerchant({ userId, mid });
  }

  async getMerchantDetails(id: string): Promise<Merchant> {
    const merchant = await this.merchantRepo.findMerchantById(id);
    if (!merchant) {
      throw new MerchantNotFoundError("Merchant not found");
    }
    return merchant;
  }

  async activateMerchant(id: string): Promise<Merchant> {
    const merchant = await this.merchantRepo.activateMerchant(id);
    if (!merchant) {
      throw new MerchantNotFoundError("Merchant not found");
    }
    return merchant;
  }

  async inactivateMerchant(id: string): Promise<Merchant> {
    const merchant = await this.merchantRepo.inactivateMerchant(id);
    if (!merchant) {
      throw new MerchantNotFoundError("Merchant not found");
    }
    return merchant;
  }

  async deleteMerchant(id: string): Promise<Merchant> {
    const merchant = await this.merchantRepo.findMerchantById(id);
    if (!merchant) {
      throw new MerchantNotFoundError("Merchant not found");
    }
    await this.merchantRepo.deleteMerchant(id);
    return merchant;
  }
}
