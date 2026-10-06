import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import AuthApi from "../api/auth.api";
import { authToken } from "../auth.store";
import AppRoutes from "@/router/app.routes";
import { useMerchantStore } from "@/app/store/merchant.store";

export function useLogout() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: AuthApi.logout,
    onSuccess: (data) => {
      authToken.clear();
      useMerchantStore.getState().setSelectedMerchantId(null);
      queryClient.clear();
      toast.success(data?.message || "Logged out successfully");
      navigate(AppRoutes.LOGIN);
    },
    onError: () => {
      // Even if session was already expired on the server, clear local state
      authToken.clear();
      useMerchantStore.getState().setSelectedMerchantId(null);
      queryClient.clear();
      toast.success("Logged out successfully");
      navigate(AppRoutes.LOGIN);
    },
  });
}

export default useLogout;
