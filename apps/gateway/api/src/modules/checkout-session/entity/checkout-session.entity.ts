export interface CheckoutSession {
  readonly id: string;
  readonly csi: string;
  readonly status: CheckoutSessionStatus;
  readonly paymentOrderId: string;
  readonly expiresAt: Date;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export type CheckoutSessionStatus =
  | "CREATED"
  | "REQUIRES_ACTION"
  | "PROCESSING_PAYMENT"
  | "EXPIRED"
  | "REVOKED"
  | "FULFILLED";
