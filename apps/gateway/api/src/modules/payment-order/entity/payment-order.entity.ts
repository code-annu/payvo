export interface PaymentOrder {
  readonly id: string;
  readonly merchantId: string;
  readonly merchantCustomerId: string;
  readonly merchantOrderId: string;
  readonly idempotencyKey: string;
  readonly csi: string;
  readonly amount: number;
  readonly currency: string;
  readonly completedAt: Date | null;
  readonly expiresAt: Date;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}
