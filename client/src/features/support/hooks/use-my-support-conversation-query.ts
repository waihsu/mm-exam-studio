import { useQuery } from "@tanstack/react-query";
import { SUPPORT_QUERY_KEYS } from "../constants/query-keys";
import { supportApi } from "../api/support-api";

export function useMySupportConversationQuery() {
  return useQuery({
    queryKey: SUPPORT_QUERY_KEYS.myConversation(),
    queryFn: async () => {
      const response = await supportApi.getMyConversation();
      if (!response.ok) {
        throw new Error(response.message);
      }
      return response.data;
    },
    refetchInterval: 15_000,
  });
}
