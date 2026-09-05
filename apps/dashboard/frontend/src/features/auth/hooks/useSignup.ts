import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import AuthApi from "../api/auth.api";
import { authToken } from "../auth.store";
import { ApiError } from "@/core/api/api.error";
import ErrorCode from "@/core/api/ErrorCode";
import AppRoutes from "@/router/app.routes";

export function useSignup() {
  const navigate = useNavigate();

  return useMutation({
    mutationFn: AuthApi.signup,
    onSuccess: (data) => {
      authToken.set(data.accessToken);
      toast.success("Account created successfully!", {
        description: "Welcome to PayO.",
      });
      navigate(AppRoutes.HOME);
    },
    onError: (error) => {
      const err = new ApiError(error);
      let description = "";
      if (err.code === ErrorCode.EMAIL_ALREADY_EXISTS)
        description = "Try to login";

      toast.error(err.message, { description });
    },
  });
}
