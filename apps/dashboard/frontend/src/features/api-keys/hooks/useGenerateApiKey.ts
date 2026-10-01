import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import ApiKeyApi from "../api/api-key.api";
import { apiKeyQueryKey } from "@/app/query/query.keys";
import type { ApiKeyEnvironment } from "../api/api-key.types";
import { ApiError } from "@/core/api/api.error";

export interface GenerateApiKeyParams {
  merchantId: string;
  environment?: ApiKeyEnvironment;
}

export function useGenerateApiKey() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ merchantId, environment = "LIVE" }: GenerateApiKeyParams) =>
      ApiKeyApi.generateApiKey(merchantId, environment),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: apiKeyQueryKey.active(
          variables.merchantId,
          data.environment,
        ),
      });
      toast.success("API key generated successfully!", {
        description: "Please save your secret key now. It won't be shown again.",
      });
    },
    onError: (error) => {
      const err = new ApiError(error);
      toast.error("Failed to generate API key", {
        description: err.message,
      });
    },
  });
}

export default useGenerateApiKey;
