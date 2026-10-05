import { useQuery } from "@tanstack/react-query";
import WebhookApi from "../api/webhook.api";
import { webhookQueryKey } from "@/app/query/query.keys";
import { useMerchantStore } from "@/app/store/merchant.store";

export function useGetMerchantWebhooks() {
  const selectedMerchantId = useMerchantStore(
    (state) => state.selectedMerchantId,
  );

  return useQuery({
    queryKey: webhookQueryKey.merchantWebhooks(selectedMerchantId ?? ""),
    queryFn: () => WebhookApi.getMerchantWebhooks(selectedMerchantId!),
    enabled: Boolean(selectedMerchantId),
  });
}

export default useGetMerchantWebhooks;
