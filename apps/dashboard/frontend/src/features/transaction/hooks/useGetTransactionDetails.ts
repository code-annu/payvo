import { useQuery } from "@tanstack/react-query";
import TransactionApi from "../api/transaction.api";
import { transactionQueryKey } from "@/app/query/query.keys";
import { useMerchantStore } from "@/app/store/merchant.store";

export function useGetTransactionDetails(
  transactionId?: string | null,
  enabled: boolean = true,
) {
  const selectedMerchantId = useMerchantStore(
    (state) => state.selectedMerchantId,
  );

  return useQuery({
    queryKey: transactionQueryKey.merchantTransactionDetails(
      selectedMerchantId ?? "",
      transactionId ?? "",
    ),
    queryFn: () =>
      TransactionApi.getTransactionDetails(
        selectedMerchantId!,
        transactionId!,
      ),
    enabled: Boolean(selectedMerchantId && transactionId && enabled),
  });
}

export default useGetTransactionDetails;
