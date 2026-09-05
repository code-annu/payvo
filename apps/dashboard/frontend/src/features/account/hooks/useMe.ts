import { userQueryKey } from "@/app/query/query.keys";
import { useQuery } from "@tanstack/react-query";
import UserApi from "../api/user.api";

export function useMe(retry: boolean = false) {
  return useQuery({
    queryKey: userQueryKey.me,
    queryFn: UserApi.getMe,
    retry,
  });
}
