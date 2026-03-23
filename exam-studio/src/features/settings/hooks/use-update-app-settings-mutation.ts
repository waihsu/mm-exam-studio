import { useMutation, useQueryClient } from "@tanstack/react-query";
import { SETTINGS_QUERY_KEYS } from "../constants/query-keys";
import { updateAppSettings } from "../services/settings-store.service";
import type { UpdateAppSettingsInput } from "../types/settings.types";

export const useUpdateAppSettingsMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateAppSettingsInput) => updateAppSettings(payload),
    onSuccess: (next) => {
      queryClient.setQueryData(SETTINGS_QUERY_KEYS.app, next);
    },
  });
};
