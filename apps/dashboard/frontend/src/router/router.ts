import { createBrowserRouter, redirect } from "react-router-dom";
import AppRoutes from "./app.routes";
import LoginPage from "@/features/auth/pages/LoginPage";
import SignupPage from "@/features/auth/pages/SignupPage";
import HomePage from "@/features/dashboard/HomePage";
import ProtectedRoute from "./ProtectedRoute";

export const appRouter = createBrowserRouter([
  // Redirect "/" → "/dashboard"
  { path: "/", loader: () => redirect(AppRoutes.HOME) },

  // Public routes
  { path: AppRoutes.LOGIN, Component: LoginPage },
  { path: AppRoutes.SIGNUP, Component: SignupPage },

  // Protected routes — wrapped in DashboardLayout
  {
    Component: ProtectedRoute,

    children: [
      {
        // Component: DashboardLayout,
        children: [
          { path: AppRoutes.HOME, Component: HomePage },
          // { path: AppRoutes.TRANSACTIONS, Component: TransactionsPage },
          // { path: AppRoutes.API_KEYS, Component: ApiKeysPage },
        ],
      },
    ],
  },
]);
