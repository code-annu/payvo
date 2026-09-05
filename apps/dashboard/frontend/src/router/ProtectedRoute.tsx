// import { ApiError } from "@/core/api/api.error";
// import ErrorCode from "@/core/api/ErrorCode";
// import { useMe } from "@/features/account/hooks/useMe";
// import CircularLoadingBar from "@/components/progress/CircularLoadingBar";
// import type React from "react";
// import { useEffect, useRef } from "react";
// import { Outlet, useNavigate } from "react-router-dom";
// import { toast } from "sonner";
// import AppRoutes from "./app.routes";

// export const ProtectedRoute: React.FC = () => {
//   const { data: user, isLoading, isError, error } = useMe();
//   const navigate = useNavigate();
//   const hasRedirectedRef = useRef(false);

//   useEffect(() => {
//     if (!isError || hasRedirectedRef.current) return;

//     hasRedirectedRef.current = true;
//     const apiError = new ApiError(error);

//     const isSessionExpired =
//       apiError.code === ErrorCode.SESSION_EXPIRED ||
//       apiError.code === ErrorCode.SESSION_REVOKED;

//     if (isSessionExpired) {
//       toast.error("Session expired", {
//         description: "Please sign in again to continue.",
//       });
//     }

//     navigate(AppRoutes.LOGIN, { replace: true });
//   }, [isError, error, navigate]);

//   if (isLoading || isError) {
//     return (
//       <div className="min-h-screen w-full bg-background flex flex-col items-center justify-center">
//         <CircularLoadingBar size={48} strokeWidth={4} />
//       </div>
//     );
//   }

//   if (!user) {
//     return null;
//   }

//   return <Outlet />;
// };

// export default ProtectedRoute;

// Temp protected route
import { Outlet } from "react-router-dom";

export const ProtectedRoute: React.FC = () => {
  return <Outlet />;
};

export default ProtectedRoute;
