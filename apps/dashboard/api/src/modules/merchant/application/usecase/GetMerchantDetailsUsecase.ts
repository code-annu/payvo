import { inject, injectable } from "inversify";
import TYPES from "@/core/di/inversify.types.js";
import MerchantRepository from "../../repository/merchant.repository.js";
import { MerchantNotFoundError } from "../../error/merchant.errors.js";

@injectable()
export default class GetMerchantDetailsUsecase {
  constructor(
    @inject(TYPES.MerchantRepository)
    private readonly merchantRepository: MerchantRepository,
  ) {}

  async execute(input: { merchantId: string; userId: string }) {
    const merchant = await this.merchantRepository.findOwnedByUser(input);

    if (!merchant) {
      throw new MerchantNotFoundError();
    }

    return merchant;
  }
}