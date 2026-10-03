import { useMutation, useQueryClient } from "@tanstack/react-query";
import ApiKeyApi from "../api/api-key.api";
import { apiKeyQueryKey } from "@/app/query/query.keys";
import { useMerchantStore } from "@/app/store/merchant.store";
import type { GenerateApiKeyPayload } from "../api/api-key.types";
import { toast } from "sonner";

export function useGenerateApiKey() {
  const queryClient = useQueryClient();
  const selectedMerchantId = useMerchantStore(
    (state) => state.selectedMerchantId,
  );

  return useMutation({
    mutationFn: (payload: GenerateApiKeyPayload = { environment: "TEST" }) => {
      if (!selectedMerchantId) {
        throw new Error("No merchant selected. Please select a merchant first.");
      }
      return ApiKeyApi.generateApiKey(selectedMerchantId, payload);
    },
    onSuccess: (data) => {
      toast.success(`${data.environment} API key generated successfully!`);
      if (selectedMerchantId) {
        queryClient.invalidateQueries({
          queryKey: apiKeyQueryKey.activeApiKey(selectedMerchantId),
        });
        queryClient.invalidateQueries({
          queryKey: apiKeyQueryKey.merchantApiKeys(selectedMerchantId),
        });
      }
    },
    onError: (err: unknown) => {
      const message =
        err instanceof Error ? err.message : "Failed to generate API key";
      toast.error(message);
    },
  });
}

export default useGenerateApiKey;
