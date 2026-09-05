import type { SuccessResponse } from "@/core/api/success.response";

export interface Merchant {
  readonly id: string;
  readonly userId: string;
  readonly mid: string;
  readonly isActive: boolean;
  readonly createdAt: Date;
}

export interface UserMerchants {
  merchants: Merchant[];
  totalMerchants: number;
}

export type UserMerchantsResponse = SuccessResponse<UserMerchants>;
export type MerchantResponse = SuccessResponse<{
  merchant: Merchant;
}>;
