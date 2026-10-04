import type { SuccessResponse } from "@/core/success.response";

export interface PaymentOrder {
  id: string;
  csi: string;
  amount: number;
  currency: string;
  expiresAt: string;
}

export interface PaymentMethod {
  id: string;
  code: string;
  name: string;
  iconUrl: string;
}

export type CheckoutOrderResponse = SuccessResponse<{
  paymentOrder: PaymentOrder;
  paymentMethods: PaymentMethod[];
}>;
