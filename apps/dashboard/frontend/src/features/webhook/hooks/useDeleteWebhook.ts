import { useMutation, useQueryClient } from "@tanstack/react-query";
import WebhookApi from "../api/webhook.api";
import { webhookQueryKey } from "@/app/query/query.keys";
import { useMerchantStore } from "@/app/store/merchant.store";
import { toast } from "sonner";

export function useDeleteWebhook() {
  const queryClient = useQueryClient();
  const selectedMerchantId = useMerchantStore(
    (state) => state.selectedMerchantId,
  );

  return useMutation({
    mutationFn: (webhookId: string) => {
      if (!selectedMerchantId) {
        throw new Error(
          "No merchant selected. Please select a merchant first.",
        );
      }
      return WebhookApi.deleteWebhook(selectedMerchantId, webhookId);
    },
    onSuccess: () => {
      toast.success("Webhook deleted successfully!");
      if (selectedMerchantId) {
        queryClient.invalidateQueries({
          queryKey: webhookQueryKey.merchantWebhooks(selectedMerchantId),
        });
      }
    },
    onError: (err: unknown) => {
      const message =
        err instanceof Error ? err.message : "Failed to delete webhook";
      toast.error(message);
    },
  });
}

export default useDeleteWebhook;
