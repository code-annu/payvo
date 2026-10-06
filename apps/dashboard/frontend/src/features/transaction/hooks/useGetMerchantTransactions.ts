import { useQuery } from "@tanstack/react-query";
import TransactionApi from "../api/transaction.api";
import { transactionQueryKey } from "@/app/query/query.keys";
import { useMerchantStore } from "@/app/store/merchant.store";

export function useGetMerchantTransactions() {
  const selectedMerchantId = useMerchantStore(
    (state) => state.selectedMerchantId,
  );

  return useQuery({
    queryKey: transactionQueryKey.merchantTransactions(selectedMerchantId ?? ""),
    queryFn: () => TransactionApi.getMerchantTransactions(selectedMerchantId!),
    enabled: Boolean(selectedMerchantId),
  });
}

export default useGetMerchantTransactions;
