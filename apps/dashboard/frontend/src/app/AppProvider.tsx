import { QueryClientProvider } from "@tanstack/react-query";
import type React from "react";
import { queryClient } from "./query-client";
import { RouterProvider } from "react-router-dom";
import { appRouter } from "@/router/router";
import { Toaster } from "sonner";

const AppProvider: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={appRouter} />
      <Toaster position="top-right" richColors closeButton />
    </QueryClientProvider>
  );
};

export default AppProvider;
