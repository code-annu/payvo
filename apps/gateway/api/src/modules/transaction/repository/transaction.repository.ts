import { inject, injectable } from "inversify";
import { client, type TransactionClient } from "@payvo/database/client";
import type { TransactionCreateInput } from "@payvo/database/types";
import TYPES from "@/core/di/inversify.types.js";
import TransactionMapper from "../transaction.mapper.js";
import type { Transaction } from "../entity/transaction.entity.js";

@injectable()
export default class TransactionRepository {
  constructor(
    @inject(TYPES.TransactionMapper)
    private readonly mapper: TransactionMapper,
  ) {}

  async create(
    tx: TransactionClient,
    data: TransactionCreateInput,
  ): Promise<Transaction> {
    const transaction = await tx.orm.public.Transaction.create(data);
    return this.mapper.toTransactionEntity(transaction);
  }
}
