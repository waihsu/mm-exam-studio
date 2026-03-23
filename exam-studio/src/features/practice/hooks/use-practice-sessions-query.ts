import { useQuery } from "@tanstack/react-query";
import { PRACTICE_QUERY_KEYS } from "../constants/query-keys";
import { listPracticeSessions } from "../services/practice.service";

export const usePracticeSessionsQuery = (enabled = true) =>
  useQuery({
    queryKey: PRACTICE_QUERY_KEYS.sessions(),
    queryFn: listPracticeSessions,
    enabled,
    staleTime: 15_000,
  });

