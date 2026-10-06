import { inject, injectable } from "inversify";
import TYPES from "@/core/di/inversify.types.js";
import { client } from "@payvo/database/client";
import TransactionMapper from "../transaction.mapper.js";
import type { Transaction } from "../entity/transaction.entity.js";
import type { TransactionDetails } from "../entity/transaction-details.entity.js";

@injectable()
export default class TransactionRepository {
  private readonly db = client;

  constructor(
    @inject(TYPES.TransactionMapper) private readonly mapper: TransactionMapper,
  ) {}

  async findByMerchantId(merchantId: string): Promise<Transaction[]> {
    const transactions = await this.db.orm.public.Transaction.where({
      merchantId,
    })
      .orderBy((t) => t.createdAt.desc())
      .all();

    return transactions.map((t) => this.mapper.toTransactionEntity(t));
  }

  async findDetails(data: {
    id: string;
    merchantId: string;
  }): Promise<TransactionDetails | null> {
    const transaction = await this.db.orm.public.Transaction.where({
      id: data.id,
      merchantId: data.merchantId,
    })
      .include("paymentOrder", (order) => order)
      .include("paymentAttempt", (attempt) =>
        attempt.include("paymentMethod", (pm) => pm),
      )
      .first();

    if (!transaction) return null;

    return this.mapper.toTransactionDetailsEntity(transaction as any);
  }
}
