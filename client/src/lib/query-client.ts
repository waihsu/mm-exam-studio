import { QueryClient } from "@tanstack/react-query";

const shouldRetryQuery = (failureCount: number, error: unknown) => {
  const status =
    typeof error === "object" &&
    error !== null &&
    "status" in error &&
    typeof error.status === "number"
      ? error.status
      : null;

  if (status === 401 || status === 403) {
    return false;
  }

  const message =
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof error.message === "string"
      ? error.message.toLowerCase()
      : "";

  if (message.includes("unauthorized") || message.includes("forbidden")) {
    return false;
  }

  return failureCount < 2;
};

export const createAppQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        gcTime: 5 * 60_000,
        refetchOnWindowFocus: false,
        retry: shouldRetryQuery,
      },
      mutations: {
        retry: false,
      },
    },
  });
