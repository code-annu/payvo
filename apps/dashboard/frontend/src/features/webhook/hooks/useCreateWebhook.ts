import { useMutation, useQueryClient } from "@tanstack/react-query";
import WebhookApi from "../api/webhook.api";
import { webhookQueryKey } from "@/app/query/query.keys";
import { useMerchantStore } from "@/app/store/merchant.store";
import type { CreateWebhookPayload } from "../api/webhook.types";
import { toast } from "sonner";

export function useCreateWebhook() {
  const queryClient = useQueryClient();
  const selectedMerchantId = useMerchantStore(
    (state) => state.selectedMerchantId,
  );

  return useMutation({
    mutationFn: (payload: CreateWebhookPayload) => {
      if (!selectedMerchantId) {
        throw new Error(
          "No merchant selected. Please select a merchant first.",
        );
      }
      return WebhookApi.createWebhook(selectedMerchantId, payload);
    },
    onSuccess: () => {
      toast.success("Webhook created successfully!");
      if (selectedMerchantId) {
        queryClient.invalidateQueries({
          queryKey: webhookQueryKey.merchantWebhooks(selectedMerchantId),
        });
      }
    },
    onError: (err: unknown) => {
      const message =
        err instanceof Error ? err.message : "Failed to create webhook";
      toast.error(message);
    },
  });
}

export default useCreateWebhook;
