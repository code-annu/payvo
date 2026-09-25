import type { Merchant as PrismaMerchant } from "@payvo/database/types";
import { injectable } from "inversify";
import type { Merchant } from "./entity/merchant.entity.js";
import type { UserMerchants } from "./entity/user-merchants.entity.js";

@injectable()
export default class MerchantMapper {
  toMerchantEntity(merchant: PrismaMerchant): Merchant {
    return {
      id: merchant.id,
      mid: merchant.mid,
      isActive: merchant.isActive,
      userId: merchant.userId,
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
      merchants: merchants.map((merchant) => ({
        id: merchant.id,
        isActive: merchant.isActive,
        mid: merchant.mid,
      })),
    };
  }
}
