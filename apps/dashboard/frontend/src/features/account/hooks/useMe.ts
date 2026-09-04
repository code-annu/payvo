import { useQuery } from "@tanstack/react-query";
import UserApi from "../api/user.api";

export function useMe() {
  return useQuery({
    queryKey: ["user"],
    queryFn: UserApi.getMe,
  });
}
