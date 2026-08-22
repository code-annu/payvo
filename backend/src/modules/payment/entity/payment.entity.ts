export interface Payment {
  readonly id: string;
  readonly merchantId: string;
  readonly customerId: string;
  readonly orderId: string;
  readonly idempotencyKey: string;
  readonly status: PaymentStatus;
  readonly amount: number;
  readonly currency: string;
  readonly description: string | null;
  readonly paymentMethod: string | null;
  readonly providerTransactionId: string | null;
  readonly failureCode: string | null;
  readonly failureMessage: string | null;
  readonly paidAt: Date | null;
  readonly expiresAt: Date | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export type PaymentStatus =
  | "CREATED"
  | "REQUIRES_ACTION"
  | "PROCESSING"
  | "SUCCESS"
  | "FAILED"
  | "CANCELED";
