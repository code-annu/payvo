import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import AuthApi from "../api/auth.api";
import { authToken } from "../auth.store";
import { ApiError } from "@/core/api/api.error";

export function useSignup() {
  return useMutation({
    mutationFn: AuthApi.signup,
    onSuccess: (data) => {
      authToken.set(data.accessToken);
      toast.success("Account created successfully!", {
        description: "Welcome to PayO.",
      });
      console.log("Signup success:", data);
    },
    onError: (error) => {
      const err = new ApiError(error);
      toast.error(err.message || "Failed to create account", {
        description:
          err.code && err.code !== "SOMETHING_WENT_WRONG"
            ? `Error: ${err.code}`
            : undefined,
      });
      console.error("Signup error:", err);
    },
  });
}
