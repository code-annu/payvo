import { useMutation, useQueryClient } from "@tanstack/react-query";
import MerchantApi from "../api/merchant.api";
import { merchantQueryKey } from "@/app/query/query.keys";
import { useMerchantStore } from "@/app/store/merchant.store";

export function useCreateMerchant() {
  const { setSelectedMerchantId } = useMerchantStore();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: MerchantApi.createMerchant,
    onSuccess: (merchant) => {
      queryClient.invalidateQueries({ queryKey: merchantQueryKey.all });
      setSelectedMerchantId(merchant.id);
    },
  });
}
