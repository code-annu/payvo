import CircularLoadingBar from "@/components/progress/CircularLoadingBar.tsx";
import { mapToAppError } from "@/core/error/error.mapper.ts";
import { serverErrorCode } from "@/core/error/ServerErrorCodes.ts";
import { Navigate, Outlet } from "react-router-dom";
import { AppRoutes } from "./routes.ts";
import { useProfile } from "@/features/account/hooks/profile-query.hook.ts";

export default function OnboardingGuard() {
  const { data: profile, isLoading, isError, error } = useProfile();

  if (isLoading) {
    return (
      <>
        <main className="flex min-h-screen items-center justify-center bg-background text-foreground">
          <CircularLoadingBar size={44} label="Checking your account" />
        </main>
      </>
    );
  }

  if (isError) {
    const errorCode = mapToAppError(error).code;
    if (errorCode === serverErrorCode.account.ACCOUNT_NOT_FOUND) {
      return <Navigate to={AppRoutes.ONBOARDING_PROFILE} replace />;
    }
    return <Navigate to={AppRoutes.LOGIN} replace />;
  }

  return profile ? (
    <Outlet context={profile} />
  ) : (
    <Navigate to={AppRoutes.ONBOARDING_PROFILE} replace />
  );
}
