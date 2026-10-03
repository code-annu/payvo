import { useQuery } from "@tanstack/react-query";
import ApiKeyApi from "../api/api-key.api";
import { apiKeyQueryKey } from "@/app/query/query.keys";
import { useMerchantStore } from "@/app/store/merchant.store";
import type { ApiKeyEnvironment } from "../api/api-key.types";

export function useGetActiveApiKey(environment: ApiKeyEnvironment = "TEST") {
  const selectedMerchantId = useMerchantStore(
    (state) => state.selectedMerchantId,
  );

  return useQuery({
    queryKey: [
      ...apiKeyQueryKey.activeApiKey(selectedMerchantId ?? ""),
      environment,
    ] as const,
    queryFn: () => ApiKeyApi.getActiveApiKey(selectedMerchantId!, environment),
    enabled: Boolean(selectedMerchantId),
  });
}

export default useGetActiveApiKey;
