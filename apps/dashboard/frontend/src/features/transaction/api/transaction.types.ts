import type { SuccessResponse } from "@/core/api/success.response";

export type PaymentType = "PAYIN" | "REFUND";

export interface TransactionItem {
  readonly id: string;
  readonly merchantId: string;
  readonly paymentOrderId: string;
  readonly paymentAttemptId: string;
  readonly paymentType: PaymentType;
  readonly grossAmount: string;
  readonly feeAmount: string;
  readonly netAmount: string;
  readonly currency: string;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface MerchantTransactionsData {
  readonly merchantId: string;
  readonly transactions: readonly TransactionItem[];
}

export interface TransactionPaymentOrder {
  readonly id: string;
  readonly merchantOrderId: string;
  readonly merchantCustomerId: string;
  readonly idempotencyKey: string;
  readonly orderNumber: string;
  readonly amount: string;
  readonly currency: string;
  readonly status: string;
  readonly completedAt: string | null;
  readonly expiresAt: string;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface TransactionPaymentMethod {
  readonly id?: string;
  readonly code: string;
  readonly name: string;
  readonly iconUrl?: string | null;
}

export interface TransactionPaymentAttempt {
  readonly id: string;
  readonly paymentMethodId?: string;
  readonly attemptNumber: number;
  readonly status: string;
  readonly failureCode: string | null;
  readonly reason: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly paymentMethod?: TransactionPaymentMethod | null;
}

export interface TransactionDetailsData extends TransactionItem {
  readonly paymentOrder: TransactionPaymentOrder | null;
  readonly paymentAttempt: TransactionPaymentAttempt | null;
  readonly paymentMethod?: TransactionPaymentMethod | null;
}

export type MerchantTransactionsResponse =
  SuccessResponse<MerchantTransactionsData>;
export type TransactionDetailsResponse =
  SuccessResponse<TransactionDetailsData>;
