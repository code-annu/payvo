import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import ApiKeyApi from "../api/api-key.api";
import { apiKeyQueryKey } from "@/app/query/query.keys";
import type {
  ApiKeyEnvironment,
  OldKeyRevokeStrategy,
} from "../api/api-key.types";
import { ApiError } from "@/core/api/api.error";

export interface RotateApiKeyParams {
  merchantId: string;
  environment?: ApiKeyEnvironment;
  oldKeyRevokeStrategy: OldKeyRevokeStrategy;
}

export function useRotateApiKey() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      merchantId,
      environment = "LIVE",
      oldKeyRevokeStrategy,
    }: RotateApiKeyParams) =>
      ApiKeyApi.rotateApiKey(merchantId, {
        environment,
        oldKeyRevokeStrategy,
      }),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: apiKeyQueryKey.active(
          variables.merchantId,
          data.environment,
        ),
      });
      toast.success("API key rotated successfully!", {
        description:
          variables.oldKeyRevokeStrategy === "24_HOURS"
            ? "Old key will remain active for 24 hours. Save your new key."
            : "Old key has been deactivated immediately. Save your new key.",
      });
    },
    onError: (error) => {
      const err = new ApiError(error);
      toast.error("Failed to rotate API key", {
        description: err.message,
      });
    },
  });
}

export default useRotateApiKey;
