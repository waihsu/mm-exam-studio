import { useQuery } from "@tanstack/react-query";
import { SUPPORT_QUERY_KEYS } from "../constants/query-keys";
import { getMySupportConversation } from "../services/support.service";

export const useMySupportConversationQuery = (enabled = true) =>
  useQuery({
    queryKey: SUPPORT_QUERY_KEYS.myConversation(),
    queryFn: getMySupportConversation,
    enabled,
  });
