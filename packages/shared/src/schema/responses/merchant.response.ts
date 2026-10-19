export interface MerchantDetailsResponse {
  id: string;
  mid: string;
  userId: string;
  closedAt: Date | null;
  status: MerchantStatus;
}

export interface UserMerchantsResponse {
  userId: string;
  merchants: {
    id: string;
    mid: string;
    status: MerchantStatus;
  }[];
}

type MerchantStatus = "ACTIVE" | "SUSPENDED" | "CLOSED";
