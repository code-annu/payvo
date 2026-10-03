import type { SuccessResponse } from "@/core/api/success.response";

export interface MerchantDetails {
  readonly id: string;
  readonly userId: string;
  readonly mid: string;
  readonly isActive: boolean;
  readonly createdAt: Date;
}

export type Merchant = Pick<MerchantDetails, "id" | "isActive" | "mid">;

export interface UserMerchants {
  readonly userId: string;
  readonly merchants: {
    readonly id: string;
    readonly isActive: boolean;
    readonly mid: string;
  }[];
}

export type UserMerchantsResponse = SuccessResponse<UserMerchants>;
export type MerchantResponse = SuccessResponse<MerchantDetails>;
