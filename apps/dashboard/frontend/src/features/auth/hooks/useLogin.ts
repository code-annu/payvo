import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import AuthApi from "../api/auth.api";
import { authToken } from "../auth.store";
import { ApiError } from "@/core/api/api.error";
import ErrorCode from "@/core/api/ErrorCode";
import { useNavigate } from "react-router-dom";
import AppRoutes from "@/router/app.routes";

export function useLogin() {
  const navigate = useNavigate();
  return useMutation({
    mutationFn: AuthApi.login,
    onSuccess: (data) => {
      authToken.set(data.accessToken);
      toast.success("Signed in successfully!", {
        description: "Welcome back to PayO.",
      });
      console.log("Login success:", data);
      navigate(AppRoutes.HOME);
    },
    onError: (error) => {
      const err = new ApiError(error);
      let description = "";
      if (err.code === ErrorCode.INVALID_CREDENTIALS)
        description = "Try with some other credentials";

      toast.error(err.message, { description });
    },
  });
}
