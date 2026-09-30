import { useMutation } from "@tanstack/react-query";
import AuthApi from "../api/auth.api";

export function useRotateToken() {
  return useMutation({
    mutationFn: AuthApi.rotateToken,
  });
}
