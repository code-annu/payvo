import CircularLoadingBar from "@/components/progress/CircularLoadingBar.tsx";
import { Navigate, Outlet, useNavigate } from "react-router-dom";
import { AppRoutes } from "./router.ts";
import { useCallback } from "react";
import type { AppError } from "@payvo/shared/error";
import { mapToAppError } from "@/core/error/error.mapper.ts";
import { useAuthMe } from "@/features/auth/hooks/auth-me.hook.ts";
import PageTitle from "@/components/text/PageTitle.tsx";

export default function ProtectedRoute() {
  const navigate = useNavigate();
  const handleError = useCallback(
    (_err: AppError) => {
      navigate(AppRoutes.LOGIN, { replace: true });
    },
    [navigate],
  );
  const { isLoading, data: account, isError, error } = useAuthMe(handleError);

  if (isLoading) {
    return (
      <>
        <PageTitle title="Payvo" />

        <main className="flex min-h-screen items-center justify-center bg-background text-foreground">
          <div className="flex flex-col items-center">
            <CircularLoadingBar size={44} label="Loading your account" />
          </div>
        </main>
      </>
    );
  }

  if (isError) {
    if (error && mapToAppError(error).statusCode === 401) {
      return null;
    }
    return (
      <main className="flex min-h-screen items-center justify-center bg-background p-6 text-foreground">
        <p role="alert">We couldn’t verify your account. Please try again.</p>
      </main>
    );
  }

  return account ? (
    <Outlet context={account} />
  ) : (
    <Navigate to={AppRoutes.LOGIN} replace />
  );
}
