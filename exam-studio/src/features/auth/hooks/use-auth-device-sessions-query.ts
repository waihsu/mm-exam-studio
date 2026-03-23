import { useQuery } from "@tanstack/react-query";
import { AUTH_DEVICE_SESSIONS_QUERY_KEY } from "../constants/query-keys";
import { listOwnSessions } from "../services/auth.service";

export const useAuthDeviceSessionsQuery = (enabled = true) =>
  useQuery({
    queryKey: AUTH_DEVICE_SESSIONS_QUERY_KEY,
    queryFn: listOwnSessions,
    enabled,
    staleTime: 10_000,
  });
