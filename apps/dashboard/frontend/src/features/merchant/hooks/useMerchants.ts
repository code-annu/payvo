import { useQuery } from "@tanstack/react-query";
import MerchantApi from "../api/merchant.api";
import { merchantQueryKey } from "@/app/query/query.keys";

export function useMerchants() {
  return useQuery({
    queryFn: MerchantApi.getUserMerchants,
    queryKey: merchantQueryKey.all,
  });
}
