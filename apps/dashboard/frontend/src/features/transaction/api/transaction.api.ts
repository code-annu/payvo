import axiosClient from "@/core/axios/axios.client";
import type {
  MerchantTransactionsData,
  MerchantTransactionsResponse,
  TransactionDetailsData,
  TransactionDetailsResponse,
} from "./transaction.types";

export default abstract class TransactionApi {
  static async getMerchantTransactions(
    merchantId: string,
  ): Promise<MerchantTransactionsData> {
    const response = await axiosClient.get<MerchantTransactionsResponse>(
      `/merchants/${merchantId}/transactions`,
    );
    return response.data.data;
  }

  static async getTransactionDetails(
    merchantId: string,
    transactionId: string,
  ): Promise<TransactionDetailsData> {
    const response = await axiosClient.get<TransactionDetailsResponse>(
      `/merchants/${merchantId}/transactions/${transactionId}`,
    );
    return response.data.data;
  }
}
