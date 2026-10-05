import { createBrowserRouter, redirect } from "react-router-dom";
import AppRoutes from "./app.routes";
import LoginPage from "@/features/auth/pages/LoginPage";
import SignupPage from "@/features/auth/pages/SignupPage";
import ProtectedRoute from "./ProtectedRoute";
import DashboardLayout from "@/features/dashboard/components/DashboardLayout";
import { HomePage } from "@/features/dashboard/HomePage";
import AccountPage from "@/features/account/pages/AccountPage";
import ApiKeyPage from "@/features/api-key/pages/ApiKeyPage";
import WebhookPage from "@/features/webhook/pages/WebhookPage";

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
        Component: DashboardLayout,
        children: [
          { path: AppRoutes.HOME, Component: HomePage },
          { path: AppRoutes.ACCOUNT_SETTINGS, Component: AccountPage },
          // { path: AppRoutes.TRANSACTIONS, Component: TransactionsPage },
          { path: AppRoutes.API_KEYS, Component: ApiKeyPage },
          { path: AppRoutes.WEBHOOKS, Component: WebhookPage },
        ],
      },
    ],
  },
]);
