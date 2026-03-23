import { useQuery } from "@tanstack/react-query";
import { AUTH_SESSION_QUERY_KEY } from "../constants/query-keys";
import { getSession } from "../services/auth.service";

export const useAuthSessionQuery = () =>
  useQuery({
    queryKey: AUTH_SESSION_QUERY_KEY,
    queryFn: getSession,
    staleTime: 15_000,
    retry: 0,
  });
