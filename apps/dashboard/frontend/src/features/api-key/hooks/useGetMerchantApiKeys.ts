import { useQuery } from "@tanstack/react-query";
import ApiKeyApi from "../api/api-key.api";
import { apiKeyQueryKey } from "@/app/query/query.keys";
import { useMerchantStore } from "@/app/store/merchant.store";

export function useGetMerchantApiKeys() {
  const selectedMerchantId = useMerchantStore(
    (state) => state.selectedMerchantId,
  );

  return useQuery({
    queryKey: apiKeyQueryKey.merchantApiKeys(selectedMerchantId ?? ""),
    queryFn: () => ApiKeyApi.getMerchantApiKeys(selectedMerchantId!),
    enabled: Boolean(selectedMerchantId),
  });
}

export default useGetMerchantApiKeys;
