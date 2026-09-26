export type PaymentOrderStatus =
  | "CREATED"
  | "PAYMENT_PENDING"
  | "EXPIRED"
  | "FAILED"
  | "COMPLETED";

export interface PaymentOrder {
  readonly id: string;
  readonly merchantId: string;
  readonly merchantCustomerId: string;
  readonly merchantOrderId: string;
  readonly idempotencyKey: string;
  readonly csi: string;
  readonly amount: string;
  readonly currency: string;
  readonly status: PaymentOrderStatus;
  readonly completedAt: Date | null;
  readonly expiresAt: Date;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}
