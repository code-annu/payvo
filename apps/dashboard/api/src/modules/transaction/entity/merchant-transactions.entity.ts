import type { Transaction } from "./transaction.entity.js";

export interface MerchantTransactions {
  readonly merchantId: string;
  readonly transactions: Transaction[];
}
