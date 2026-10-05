import CircularLoadingBar from "@/components/progress/CircularLoadingBar";
import { ApiError } from "@/core/api/api.error";
import { useAccount } from "@/features/account/hooks/useAccount";
import { Outlet, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import AppRoutes from "./app.routes";
import { useEffect } from "react";
import apiErrorCode from "@/core/api/ApiErrorCode";
import type { AxiosError } from "axios";

export const ProtectedRoute: React.FC = () => {
  const { data: user, isLoading, isError, error } = useAccount();
  const navigate = useNavigate();

  useEffect(() => {
    if (isError) {
      const err = error as AxiosError
      console.log(err.response)
      const apiError = new ApiError(error);
      console.log("error: ", error);
      const isSessionExpired =
        apiError.code === apiErrorCode.auth.EXPIRED_SESSION ||
        apiError.code === apiErrorCode.auth.REVOKED_REFRESH_TOKEN ||
        apiError.code === apiErrorCode.auth.INVALID_REFRESH_TOKEN;
      if (isSessionExpired) {
        toast.error("Session expired", {
          description: "Please sign in again to continue.",
        });
      }
      navigate(AppRoutes.LOGIN, { replace: true });
    }
  }, [isError, error, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen w-full bg-background flex flex-col items-center justify-center">
        <CircularLoadingBar size={48} strokeWidth={4} />
      </div>
    );
  }

  if (!user) return null;

  return <Outlet />;
};

export default ProtectedRoute;
