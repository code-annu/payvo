import type { Transaction } from "../../entity/transaction.entity.js";

export interface GetMerchantTransactionsInputDto {
  merchantId: string;
  userId: string;
}

export interface GetMerchantTransactionsOutputDto {
  merchantId: string;
  transactions: Transaction[];
}
