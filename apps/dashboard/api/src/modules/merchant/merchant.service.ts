import TYPES from "@/core/di/inversify.types.js";
import { generateAlphaNumericId } from "@payvo/shared/crypto";
import { inject, injectable } from "inversify";
import MerchantRepository from "./repository/merchant.repository.js";
import { GetMerchantDto } from "./dto/GetMerchantDto.js";
import { DeleteMerchantDto } from "./dto/DeleteMerchantDto.js";
import { Merchant } from "./entity/merchant.entity.js";
import { UserMerchants } from "./entity/user-merchants.entity.js";
import {
  MerchantAccessDeniedError,
  MerchantInactiveError,
  MerchantNotFoundError,
} from "./error/merchant.errors.js";

@injectable()
export default class MerchantService {
  constructor(
    @inject(TYPES.MerchantRepository)
    private readonly merchantRepo: MerchantRepository,
  ) {}

  private async findActiveMerchantForUserOrThrow(
    userId: string,
    merchantId: string,
  ): Promise<Merchant> {
    const merchant = await this.merchantRepo.findById(merchantId);
    if (!merchant) {
      throw new MerchantNotFoundError("Merchant not found");
    }
    if (merchant.userId !== userId) {
      throw new MerchantAccessDeniedError("Merchant does not belong to user");
    }
    if (!merchant.isActive) {
      throw new MerchantInactiveError("Merchant is inactive");
    }
    return merchant;
  }

  async createMerchant(userId: string): Promise<Merchant> {
    let mid = generateAlphaNumericId();
    while (await this.merchantRepo.findByMid(mid)) {
      mid = generateAlphaNumericId();
    }

    return await this.merchantRepo.create({
      userId,
      mid,
    });
  }

  async getMerchant(input: GetMerchantDto): Promise<Merchant> {
    return this.findActiveMerchantForUserOrThrow(input.userId, input.merchantId);
  }

  async deleteMerchant(input: DeleteMerchantDto): Promise<void> {
    await this.findActiveMerchantForUserOrThrow(input.userId, input.merchantId);
    await this.merchantRepo.delete(input.merchantId);
  }

  async getUserMerchants(userId: string): Promise<UserMerchants> {
    return await this.merchantRepo.findByUserId(userId);
  }
}