import { inject, injectable } from "inversify";
import TYPES from "@/core/di/inversify.types.js";
import MerchantRepository from "../../repository/merchant.repository.js";

@injectable()
export default class GetUserMerchantsUsecase {
  constructor(
    @inject(TYPES.MerchantRepository)
    private readonly merchantRepository: MerchantRepository,
  ) {}

  async execute(userId: string) {
    return this.merchantRepository.findByUserId(userId);
  }
}