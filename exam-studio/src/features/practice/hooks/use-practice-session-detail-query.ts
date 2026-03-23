import { useQuery } from "@tanstack/react-query";
import { PRACTICE_QUERY_KEYS } from "../constants/query-keys";
import { getPracticeSessionDetail } from "../services/practice.service";

export const usePracticeSessionDetailQuery = (sessionId: string, enabled = true) =>
  useQuery({
    queryKey: PRACTICE_QUERY_KEYS.session(sessionId),
    queryFn: () => getPracticeSessionDetail(sessionId),
    enabled: enabled && sessionId.trim().length > 0,
  });

