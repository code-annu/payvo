import { useMutation, useQueryClient } from "@tanstack/react-query";
import MerchantApi from "../api/merchant.api";
import { merchantQueryKey } from "@/app/query/query.keys";
import type { MerchantDetails } from "../api/merchant.types";
import { useNavigate } from "react-router-dom";
import AppRoutes from "@/router/app.routes";
import { useMerchantStore } from "@/app/store/merchant.store";

export function useCreateMerchant(
  onCreated?: (merchant: MerchantDetails) => void,
) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { setSelectedMerchantId } = useMerchantStore((state) => state);

  return useMutation({
    mutationFn: MerchantApi.createMerchant,
    onSuccess: (merchant) => {
      queryClient.invalidateQueries({ queryKey: merchantQueryKey.all });
      setSelectedMerchantId(merchant.id);
      onCreated?.(merchant);
      navigate(AppRoutes.HOME);
    },
  });
}
