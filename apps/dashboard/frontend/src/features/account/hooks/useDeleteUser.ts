import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import UserApi from "../api/user.api";
import { authToken } from "@/features/auth/auth.store";
import { ApiError } from "@/core/api/api.error";
import AppRoutes from "@/router/app.routes";

export function useDeleteUser() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: UserApi.deleteMe,
    onSuccess: () => {
      authToken.clear();
      queryClient.clear();
      toast.success("Account deleted successfully", {
        description: "Your account and data have been removed.",
      });
      navigate(AppRoutes.LOGIN);
    },
    onError: (error) => {
      const err = new ApiError(error);
      toast.error("Failed to delete account", {
        description: err.message,
      });
    },
  });
}

export default useDeleteUser;
