import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import UserApi from "../api/user.api";
import type { UserUpdateRequest } from "../api/user.types";
import { userQueryKey } from "@/app/query/query.keys";
import { ApiError } from "@/core/api/api.error";

export function useUpdateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UserUpdateRequest) => UserApi.updateMe(data),
    onSuccess: (updatedUser) => {
      queryClient.setQueryData(userQueryKey.me, updatedUser);
      queryClient.invalidateQueries({ queryKey: userQueryKey.me });
      toast.success("Profile updated successfully", {
        description: "Your changes have been saved.",
      });
    },
    onError: (error) => {
      const err = new ApiError(error);
      toast.error("Failed to update profile", {
        description: err.message,
      });
    },
  });
}

export default useUpdateUser;
