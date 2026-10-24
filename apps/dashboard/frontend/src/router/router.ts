import LoginPage from "@/features/auth/pages/LoginPage.tsx";
import SignupPage from "@/features/auth/pages/SignupPage.tsx";
import HomePage from "@/features/dashboard/pages/HomePage.tsx";
import DashboardLayout from "@/features/dashboard/components/DashboardLayout.tsx";
import AccountPage from "@/features/account/pages/AccountPage.tsx";
import ApiKeyPage from "@/features/api-key/pages/ApiKeyPage.tsx";
import ProtectedRoute from "./ProtectedRoute.tsx";
import OnboardingGuard from "./OnboardingGuard.tsx";
import MerchantGuard from "./MerchantGuard.tsx";
import OnboardingProfilePage from "@/features/onboarding/pages/OnboardingProfilePage.tsx";
import OnboardingLayout from "@/features/onboarding/components/OnboardingLayout.tsx";
import OnboardingAddressPage from "@/features/onboarding/pages/OnboardingAddressPage.tsx";
import { createBrowserRouter, redirect } from "react-router-dom";
import { AppRoutes } from "./routes.ts";
import TransactionPage from "@/features/dashboard/pages/TransactionPage.tsx";

export { AppRoutes } from "./routes.ts";

export const appRouter = createBrowserRouter([
  // Redirect "/" → "/dashboard"
  { path: "/", loader: () => redirect(AppRoutes.HOME) },

  // Public routes
  { path: AppRoutes.LOGIN, Component: LoginPage },
  { path: AppRoutes.SIGNUP, Component: SignupPage },
  {
    Component: ProtectedRoute,
    children: [
      {
        Component: OnboardingGuard,
        children: [
          {
            Component: MerchantGuard,
            children: [
              {
                Component: DashboardLayout,
                children: [
                  { path: AppRoutes.HOME, Component: HomePage },
                  { path: AppRoutes.API_KEYS, Component: ApiKeyPage },
                  {
                    path: AppRoutes.TRANSACTIONS,
                    Component: TransactionPage,
                  },
                  { path: AppRoutes.ACCOUNT_SETTINGS, Component: AccountPage },
                ],
              },
            ],
          },
        ],
      },
      {
        path: AppRoutes.ONBOARDING,
        Component: OnboardingLayout,
        children: [
          { index: true, loader: () => redirect(AppRoutes.ONBOARDING_PROFILE) },
          { path: "profile", Component: OnboardingProfilePage },
          { path: "address", Component: OnboardingAddressPage },
        ],
      },
    ],
  },
]);
