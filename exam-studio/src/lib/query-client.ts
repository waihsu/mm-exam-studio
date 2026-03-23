import { QueryClient } from "@tanstack/react-query";
import { ApiClientError } from "./api-client";

const shouldRetryQuery = (failureCount: number, error: unknown) => {
  if (failureCount >= 2) {
    return false;
  }

  if (!(error instanceof ApiClientError)) {
    return true;
  }

  if (!error.statusCode) {
    return true;
  }

  if (error.statusCode === 408 || error.statusCode === 429) {
    return true;
  }

  return error.statusCode >= 500;
};

export const appQueryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: shouldRetryQuery,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 8000),
      staleTime: 30_000,
      gcTime: 5 * 60_000,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 0,
    },
  },
});
