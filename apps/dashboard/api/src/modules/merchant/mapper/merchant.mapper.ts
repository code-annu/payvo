import type { Merchant } from "@payvo/database/types";
import { injectable } from "inversify";
import {
  MerchantDetailsResponse,
  UserMerchantsResponse,
} from "@payvo/shared/schema/responses";

@injectable()
export default class MerchantMapper {
  mapToMerchantDetailsResponse(merchant: Merchant): MerchantDetailsResponse {
    return {
      id: merchant.id,
      mid: merchant.mid,
      userId: merchant.userId,
      closedAt: merchant.closedAt,
      status: merchant.status,
    };
  }

  mapToUserMerchantsResponse(
    userId: string,
    merchants: Merchant[],
  ): UserMerchantsResponse {
    return {
      userId,
      merchants: merchants.map(({ id, mid, status }) => ({ id, mid, status })),
    };
  }
}
