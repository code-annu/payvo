import { userQueryKey } from "@/app/query/query.keys";
import { useQuery } from "@tanstack/react-query";
import UserApi from "../api/user.api";

export function useAccount(retry: boolean = false) {
  return useQuery({
    queryKey: userQueryKey.account,
    queryFn: UserApi.getMe,
    retry,
  });
}
