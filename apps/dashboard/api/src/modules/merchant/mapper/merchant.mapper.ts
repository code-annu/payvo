import type { Merchant } from "@payvo/database/types";
import { injectable } from "inversify";
import type {
  MerchantOutputDto,
  UserMerchantsDto,
} from "../application/dto/merchant.dto.js";

@injectable()
export default class MerchantMapper {
  mapToMerchantOutput(merchant: Merchant): MerchantOutputDto {
    return {
      id: merchant.id,
      mid: merchant.mid,
      userId: merchant.userId,
      closedAt: merchant.closedAt,
      status: merchant.status,
    };
  }

  mapToUserMerchantsOutput(
    userId: string,
    merchants: Merchant[],
  ): UserMerchantsDto {
    return {
      userId,
      merchants: merchants.map(({ id, mid, status }) => ({ id, mid, status })),
    };
  }
}
