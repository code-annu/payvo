// import { createBrowserRouter, redirect } from "react-router";

// export enum AppRoutes {
//   HOME = "/dashboard",
//   LOGIN = "/login",
//   SIGNUP = "/signup",
//   TRANSACTIONS = "/transactions",
//   API_KEYS = "/api-keys",
//   WEBHOOKS = "/webhooks",
//   ACCOUNT_SETTINGS = "/settings",
// }




// export const appRouter = createBrowserRouter([
//   // Redirect "/" → "/dashboard"
//   { path: "/", loader: () => redirect(AppRoutes.HOME) },

//   // Public routes
//   { path: AppRoutes.LOGIN, Component: LoginPage },
//   { path: AppRoutes.SIGNUP, Component: SignupPage },

//   // Protected routes — wrapped in DashboardLayout
//   {
//     Component: ProtectedRoute,

//     children: [
//       {
//         Component: DashboardLayout,
//         children: [
//           { path: AppRoutes.HOME, Component: HomePage },
//           { path: AppRoutes.ACCOUNT_SETTINGS, Component: AccountPage },
//           // { path: AppRoutes.TRANSACTIONS, Component: TransactionsPage },
//           { path: AppRoutes.API_KEYS, Component: ApiKeyPage },
//           { path: AppRoutes.WEBHOOKS, Component: WebhookPage },
//         ],
//       },
//     ],
//   },
// ]);
