import type { Transaction as PrismaTransaction } from "@payvo/database/types";
import { injectable } from "inversify";
import type { PaymentType, Transaction } from "./entity/transaction.entity.js";

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
}
