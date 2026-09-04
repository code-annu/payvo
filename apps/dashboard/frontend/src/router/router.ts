import { createBrowserRouter } from "react-router-dom";
import AppRoutes from "./app.routes";
import LoginPage from "@/features/auth/pages/LoginPage";
import SignupPage from "@/features/auth/pages/SignupPage";
import ProtectedRoute from "./ProtectedRoute";
import HomePage from "@/features/dashboard/HomePage";

export const appRouter = createBrowserRouter([
  // public routes
  { path: AppRoutes.LOGIN, Component: LoginPage },
  { path: AppRoutes.SIGNUP, Component: SignupPage },

  // Protected routes
  {
    Component: ProtectedRoute,
    children: [{ path: AppRoutes.HOME, Component: HomePage }],
  },
]);
