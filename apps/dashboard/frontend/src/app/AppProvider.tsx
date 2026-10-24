import { appRouter } from "@/router/router.ts";
import { QueryClientProvider } from "@tanstack/react-query";
import type React from "react";
import { RouterProvider } from "react-router-dom";
import { Toaster } from "sonner";
import { queryClient } from "./query/query-client.ts";

const AppProvider: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={appRouter} />
      <Toaster position="top-right" richColors closeButton />
    </QueryClientProvider>
  );
};

export default AppProvider;
