import type {
  Transaction as PrismaTransaction,
  PaymentOrder as PrismaPaymentOrder,
  PaymentAttempt as PrismaPaymentAttempt,
  PaymentMethod as PrismaPaymentMethod,
} from "@payvo/database/types";
import { injectable } from "inversify";
import type { PaymentType, Transaction } from "./entity/transaction.entity.js";
import type {
  TransactionDetails,
  TransactionPaymentOrder,
  TransactionPaymentAttempt,
  TransactionPaymentMethod,
} from "./entity/transaction-details.entity.js";

export type PrismaPaymentAttemptWithMethod = PrismaPaymentAttempt & {
  paymentMethod?: PrismaPaymentMethod | null;
};

export type PrismaTransactionWithDetails = PrismaTransaction & {
  paymentOrder?: PrismaPaymentOrder | null;
  paymentAttempt?: PrismaPaymentAttemptWithMethod | null;
};

@injectable()
export default class TransactionMapper {
  toTransactionEntity(transaction: PrismaTransaction): Transaction {
    return {
      id: transaction.id,
      merchantId: transaction.merchantId,
      paymentOrderId: transaction.paymentOrderId,
      paymentAttemptId: transaction.paymentAttemptId,
      paymentType: transaction.paymentType as PaymentType,
      grossAmount: String(transaction.grossAmount),
      feeAmount: String(transaction.feeAmount),
      netAmount: String(transaction.netAmount),
      currency: transaction.currency,
      createdAt: new Date(transaction.createdAt),
      updatedAt: new Date(transaction.updatedAt),
    };
  }

  toPaymentOrderEntity(order: PrismaPaymentOrder): TransactionPaymentOrder {
    return {
      id: order.id,
      merchantOrderId: order.merchantOrderId,
      merchantCustomerId: order.merchantCustomerId,
      idempotencyKey: order.idempotencyKey,
      orderNumber: order.orderNumber.toString(),
      amount: String(order.amount),
      currency: order.currency,
      status: order.status,
      completedAt: order.completedAt ? new Date(order.completedAt) : null,
      expiresAt: new Date(order.expiresAt),
      createdAt: new Date(order.createdAt),
      updatedAt: new Date(order.updatedAt),
    };
  }

  toPaymentMethodEntity(
    paymentMethod: PrismaPaymentMethod,
  ): TransactionPaymentMethod {
    return {
      id: paymentMethod.id,
      code: paymentMethod.code,
      name: paymentMethod.name,
      iconUrl: paymentMethod.iconUrl ?? null,
    };
  }

  toPaymentAttemptEntity(
    attempt: PrismaPaymentAttemptWithMethod,
  ): TransactionPaymentAttempt {
    return {
      id: attempt.id,
      paymentMethodId: attempt.paymentMethodId,
      attemptNumber: attempt.attemptNumber,
      status: attempt.status,
      failureCode: attempt.failureCode ?? null,
      reason: attempt.reason ?? null,
      createdAt: new Date(attempt.createdAt),
      updatedAt: new Date(attempt.updatedAt),
      paymentMethod: attempt.paymentMethod
        ? this.toPaymentMethodEntity(attempt.paymentMethod)
        : null,
    };
  }

  toTransactionDetailsEntity(
    transaction: PrismaTransactionWithDetails,
  ): TransactionDetails {
    const isSuccessfulAttempt =
      transaction.paymentAttempt &&
      transaction.paymentAttempt.status === "SUCCEED";

    const mappedAttempt = isSuccessfulAttempt
      ? this.toPaymentAttemptEntity(transaction.paymentAttempt!)
      : null;

    return {
      ...this.toTransactionEntity(transaction),
      paymentOrder: transaction.paymentOrder
        ? this.toPaymentOrderEntity(transaction.paymentOrder)
        : null,
      paymentAttempt: mappedAttempt,
      paymentMethod: mappedAttempt?.paymentMethod ?? null,
    };
  }
}
