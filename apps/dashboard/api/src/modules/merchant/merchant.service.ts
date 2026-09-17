import TYPES from "@/core/di/inversify.types.js";
import { generateAlphaNumericId } from "@payvo/shared/crypto";
import { inject, injectable } from "inversify";
import MerchantRepository from "./repository/merchant.repository.js";
import { GetMerchantDto } from "./dto/GetMerchantDto.js";
import { DeleteMerchantDto } from "./dto/DeleteMerchantDto.js";
import { Merchant } from "./entity/merchant.entity.js";
import { UserMerchants } from "./entity/user-merchants.entity.js";
import { MerchantNotFoundError } from "./error/merchant.errors.js";

@injectable()
export default class MerchantService {
  constructor(
    @inject(TYPES.MerchantRepository)
    private readonly merchantRepo: MerchantRepository,
  ) {}

  async createMerchant(userId: string): Promise<Merchant> {
    let mid = generateAlphaNumericId();
    while (await this.merchantRepo.checkMidExists(mid)) {
      mid = generateAlphaNumericId();
    }

    return await this.merchantRepo.create({ userId, mid });
  }

  async getMerchantDetails(input: GetMerchantDto): Promise<Merchant> {
    const merchant = await this.merchantRepo.findUserMerchant(input);
    if (!merchant) throw new MerchantNotFoundError();
    return merchant;
  }

  async deleteMerchant(input: DeleteMerchantDto): Promise<void> {
    const merchant = await this.merchantRepo.delete(input);
    if (!merchant) throw new MerchantNotFoundError();
    return;
  }

  async getUserMerchants(userId: string): Promise<UserMerchants> {
    return await this.merchantRepo.findByUserId(userId);
  }
}
