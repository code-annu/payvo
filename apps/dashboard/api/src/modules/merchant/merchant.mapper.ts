import { Merchant as PrismaMerchant } from "@payvo/database";
import { injectable } from "inversify";
import { Merchant } from "./entity/merchant.entity.js";
import { UserMerchants } from "./entity/user-merchants.entity.js";

@injectable()
export default class MerchantMapper {
  toMerchantEntity(merchant: PrismaMerchant): Merchant {
    return {
      id: merchant.id,
      userId: merchant.userId,
      isActive: merchant.isActive,
      mid: merchant.mid,
      createdAt: new Date(merchant.createdAt),
      updatedAt: new Date(merchant.updatedAt),
    };
  }

  toUserMerchantsEntity(
    userId: string,
    merchants: PrismaMerchant[],
  ): UserMerchants {
    return {
      userId,
      merchants: merchants.map((m) => this.toMerchantEntity(m)),
    };
  }
}
