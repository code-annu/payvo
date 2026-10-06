import type { Transaction } from "./transaction.entity.js";

export interface TransactionPaymentOrder {
  readonly id: string;
  readonly merchantOrderId: string;
  readonly merchantCustomerId: string;
  readonly idempotencyKey: string;
  readonly orderNumber: string;
  readonly amount: string;
  readonly currency: string;
  readonly status: string;
  readonly completedAt: Date | null;
  readonly expiresAt: Date;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export interface TransactionPaymentMethod {
  readonly id: string;
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
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly paymentMethod?: TransactionPaymentMethod | null;
}

export interface TransactionDetails extends Transaction {
  readonly paymentOrder: TransactionPaymentOrder | null;
  readonly paymentAttempt: TransactionPaymentAttempt | null;
  readonly paymentMethod?: TransactionPaymentMethod | null;
}
