import { createBrowserRouter } from "react-router-dom";
import AppRoutes from "./app.routes";
import LoginPage from "@/features/auth/pages/LoginPage";
import SignupPage from "@/features/auth/pages/SignupPage";

export const appRouter = createBrowserRouter([
  // public routes
  { path: AppRoutes.LOGIN, Component: LoginPage },
  { path: AppRoutes.SIGNUP, Component: SignupPage },
]);
