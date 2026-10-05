import { useQuery } from "@tanstack/react-query";
import WebhookApi from "../api/webhook.api";
import { webhookQueryKey } from "@/app/query/query.keys";
import { useMerchantStore } from "@/app/store/merchant.store";

export function useGetWebhookDetails(
  webhookId: string,
  enabled: boolean = true,
) {
  const selectedMerchantId = useMerchantStore(
    (state) => state.selectedMerchantId,
  );

  return useQuery({
    queryKey: webhookQueryKey.merchantWebhookDetails(
      selectedMerchantId ?? "",
      webhookId,
    ),
    queryFn: () => WebhookApi.getWebhookDetails(selectedMerchantId!, webhookId),
    enabled: Boolean(selectedMerchantId && webhookId && enabled),
  });
}

export default useGetWebhookDetails;
