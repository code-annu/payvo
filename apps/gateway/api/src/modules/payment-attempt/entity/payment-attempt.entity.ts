export type PaymentAttemptStatus = "PROCESSING" | "FAILED" | "SUCCEED";

export interface PaymentAttempt {
  readonly id: string;
  readonly paymentOrderId: string;
  readonly paymentMethodId: string;
  readonly attemptNumber: number;
  readonly status: PaymentAttemptStatus;
  readonly failureCode?: string | null;
  readonly reason?: string | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}
