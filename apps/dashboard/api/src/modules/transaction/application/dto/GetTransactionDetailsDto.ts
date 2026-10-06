import type { TransactionDetails } from "../../entity/transaction-details.entity.js";

export interface GetTransactionDetailsInputDto {
  merchantId: string;
  transactionId: string;
  userId: string;
}

export type GetTransactionDetailsOutputDto = TransactionDetails;
