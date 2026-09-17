import { Merchant as PrismaMerchant } from "@payvo/database/types";
import { injectable } from "inversify";
import { Merchant } from "./entity/merchant.entity.js";
import { UserMerchants } from "./entity/user-merchants.entity.js";

@injectable()
export default class MerchantMapper {
  toMerchantEntity(merchant: PrismaMerchant): Merchant {
    return {
      id: merchant.id,
      mid: merchant.mid,
      userId: merchant.userId,
      isActive: merchant.isActive,
      createdAt: new Date(merchant.createdAt),
      updatedAt: new Date(merchant.updatedAt),
    };
  }

  toUserMerchantsEntity(
    userId: string,
    merchants: Array<Pick<PrismaMerchant, "id" | "mid" | "isActive">>,
  ): UserMerchants {
    return {
      userId,
      merchants: merchants.map((m) => ({
        id: m.id,
        mid: m.mid,
        isActive: m.isActive,
      })),
    };
  }
}
