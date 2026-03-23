import { useQuery } from "@tanstack/react-query";
import { SETTINGS_QUERY_KEYS } from "../constants/query-keys";
import { getAppSettings } from "../services/settings-store.service";

export const useAppSettingsQuery = () =>
  useQuery({
    queryKey: SETTINGS_QUERY_KEYS.app,
    queryFn: getAppSettings,
    staleTime: Infinity,
  });
