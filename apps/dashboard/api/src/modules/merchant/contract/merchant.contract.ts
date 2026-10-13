import type { Merchant } from "@payvo/database/types";

export interface MerchantContract {
  getActiveMerchantOwnedByUser(
    userId: string,
    merchantId: string,
  ): Promise<Merchant>;
}
