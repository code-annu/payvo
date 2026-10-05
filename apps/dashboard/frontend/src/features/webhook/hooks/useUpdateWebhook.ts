import { useMutation, useQueryClient } from "@tanstack/react-query";
import WebhookApi from "../api/webhook.api";
import { webhookQueryKey } from "@/app/query/query.keys";
import { useMerchantStore } from "@/app/store/merchant.store";
import type { UpdateWebhookPayload } from "../api/webhook.types";
import { toast } from "sonner";

export interface UpdateWebhookArgs {
  webhookId: string;
  payload: UpdateWebhookPayload;
}

export function useUpdateWebhook() {
  const queryClient = useQueryClient();
  const selectedMerchantId = useMerchantStore(
    (state) => state.selectedMerchantId,
  );

  return useMutation({
    mutationFn: ({ webhookId, payload }: UpdateWebhookArgs) => {
      if (!selectedMerchantId) {
        throw new Error(
          "No merchant selected. Please select a merchant first.",
        );
      }
      return WebhookApi.updateWebhook(selectedMerchantId, webhookId, payload);
    },
    onSuccess: (_, { webhookId }) => {
      toast.success("Webhook updated successfully!");
      if (selectedMerchantId) {
        queryClient.invalidateQueries({
          queryKey: webhookQueryKey.merchantWebhooks(selectedMerchantId),
        });
        queryClient.invalidateQueries({
          queryKey: webhookQueryKey.merchantWebhookDetails(
            selectedMerchantId,
            webhookId,
          ),
        });
      }
    },
    onError: (err: unknown) => {
      const message =
        err instanceof Error ? err.message : "Failed to update webhook";
      toast.error(message);
    },
  });
}

export default useUpdateWebhook;
