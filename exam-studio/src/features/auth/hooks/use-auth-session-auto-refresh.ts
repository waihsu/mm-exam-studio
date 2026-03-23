import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { AppState } from "react-native";
import { AUTH_SESSION_QUERY_KEY } from "../constants/query-keys";

export const useAuthSessionAutoRefresh = () => {
  const queryClient = useQueryClient();

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextState) => {
      if (nextState !== "active") {
        return;
      }

      queryClient.invalidateQueries({
        queryKey: AUTH_SESSION_QUERY_KEY,
      });
    });

    return () => subscription.remove();
  }, [queryClient]);
};

