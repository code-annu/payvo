import type { SuccessResponse } from "@/core/api/success.response";

export interface PaymentOrder {
  id: string;
  csi: string;
  orderNumber: string | number;
  amount: number;
  currency: string;
  expiresAt: Date;
  completedAt: Date | null;
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

export type PaymentAttemptStatus = "PROCESSING" | "FAILED" | "SUCCEED";

export interface AttemptPaymentInput {
  paymentOrderId: string;
  paymentMethodCode: string;
}

export interface AttemptPaymentResult {
  paymentAttemptId: string;
  paymentMethod: {
    id: string;
    code: string;
    name: string;
  };
  status: PaymentAttemptStatus;
}

export type AttemptPaymentResponse = SuccessResponse<AttemptPaymentResult>;
