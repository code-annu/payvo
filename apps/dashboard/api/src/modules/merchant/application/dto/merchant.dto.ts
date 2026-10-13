import { MerchantStatus } from "@payvo/database/types";

export interface MerchantOutputDto {
  id: string;
  mid: string;
  userId: string;
  closedAt: Date | null;
  status: MerchantStatus;
}

export interface UserMerchantsDto {
  userId: string;
  merchants: {
    id: string;
    mid: string;
    status: MerchantStatus;
  }[];
}
