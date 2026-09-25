import { generateAlphaNumericId } from "@payvo/shared/crypto";
import { inject, injectable } from "inversify";
import TYPES from "@/core/di/inversify.types.js";
import MerchantRepository from "../../repository/merchant.repository.js";

@injectable()
export default class CreateMerchantUsecase {
  constructor(
    @inject(TYPES.MerchantRepository)
    private readonly merchantRepository: MerchantRepository,
  ) {}

  async execute(userId: string) {
    const merchant = await this.merchantRepository.create({
      mid: generateAlphaNumericId(),
      userId,
    });

    return merchant;
  }
}
