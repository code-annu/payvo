export type PaymentType = "PAYIN" | "REFUND";

export interface Transaction {
  readonly id: string;
  readonly merchantId: string;
  readonly paymentOrderId: string;
  readonly paymentAttemptId: string;
  readonly paymentType: PaymentType;
  readonly grossAmount: string;
  readonly feeAmount: string;
  readonly netAmount: string;
  readonly currency: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}
