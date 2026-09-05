import { useQuery } from "@tanstack/react-query";
import ApiKeyApi from "../api/api-key.api";
import { apiKeyQueryKey } from "@/app/query/query.keys";
import type { ApiKeyEnvironment } from "../api/api-key.types";

export interface UseMerchantApiKeyOptions {
  merchantId: string | null;
  environment?: ApiKeyEnvironment;
  enabled?: boolean;
}

export function useMerchantApiKey({
  merchantId,
  environment = "LIVE",
  enabled = true,
}: UseMerchantApiKeyOptions) {
  return useQuery({
    queryKey: apiKeyQueryKey.active(merchantId ?? "", environment),
    queryFn: () => {
      if (!merchantId) return;
      return ApiKeyApi.getMerchantActiveApiKey(merchantId, environment);
    },
    enabled: Boolean(merchantId) && enabled,
    retry: false,
  });
}

export default useMerchantApiKey;
