import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import AuthApi from "../api/auth.api";
import { authToken } from "../auth.store";
import { ApiError } from "@/core/api/api.error";

export function useLogin() {
  return useMutation({
    mutationFn: AuthApi.login,
    onSuccess: (data) => {
      authToken.set(data.accessToken);
      toast.success("Signed in successfully!", {
        description: "Welcome back to PayO.",
      });
      console.log("Login success:", data);
    },
    onError: (error) => {
      const err = new ApiError(error);
      toast.error(err.message || "Failed to sign in", {
        description:
          err.code && err.code !== "SOMETHING_WENT_WRONG"
            ? `Error: ${err.code}`
            : undefined,
      });
      console.error("Login error:", err);
    },
  });
}
