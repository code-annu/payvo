import { useMutation, useQueryClient } from "@tanstack/react-query";
import ApiKeyApi from "../api/api-key.api";
import { apiKeyQueryKey } from "@/app/query/query.keys";
import { useMerchantStore } from "@/app/store/merchant.store";
import { toast } from "sonner";

export function useRevokeApiKey() {
  const queryClient = useQueryClient();
  const selectedMerchantId = useMerchantStore(
    (state) => state.selectedMerchantId,
  );

  return useMutation({
    mutationFn: (apiKeyId: string) => {
      if (!selectedMerchantId) {
        throw new Error("No merchant selected. Please select a merchant first.");
      }
      return ApiKeyApi.revokeApiKey(selectedMerchantId, apiKeyId);
    },
    onSuccess: () => {
      toast.success("API key revoked successfully");
      if (selectedMerchantId) {
        queryClient.invalidateQueries({
          queryKey: apiKeyQueryKey.merchantApiKeys(selectedMerchantId),
        });
      }
    },
    onError: (err: unknown) => {
      const message =
        err instanceof Error ? err.message : "Failed to revoke API key";
      toast.error(message);
    },
  });
}

export default useRevokeApiKey;
