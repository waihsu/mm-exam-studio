import { useCallback } from "react";
import { DEFAULT_APP_SETTINGS } from "../types/settings.types";
import { useAppSettingsQuery } from "./use-app-settings-query";
import { formatDateTimeWithSettings } from "../utils/date-time-format";

export const useAppDateTimeFormatter = () => {
  const appSettingsQuery = useAppSettingsQuery();
  const settings = appSettingsQuery.data ?? DEFAULT_APP_SETTINGS;

  const formatDateTime = useCallback(
    (value: string | number | Date | null | undefined) =>
      formatDateTimeWithSettings(value, settings),
    [settings],
  );

  return {
    settings,
    formatDateTime,
  };
};
