import { QueryClientProvider } from "@tanstack/react-query";
import type React from "react";
import { queryClient } from "./query-client";

interface QueryProviderProps {
  children: React.ReactNode;
}
const QueryProvider: React.FC<QueryProviderProps> = ({ children }) => {
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

export default QueryProvider;
