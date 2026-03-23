import { QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import { appQueryClient } from "./query-client";

type QueryProviderProps = {
  children: React.ReactNode;
};

export const QueryProvider = ({ children }: QueryProviderProps) => (
  <QueryClientProvider client={appQueryClient}>{children}</QueryClientProvider>
);
