import React, { useEffect } from "react";
import { useAppSettingsQuery } from "@/features/settings/hooks/use-app-settings-query";
import { DEFAULT_APP_SETTINGS } from "@/features/settings/types/settings.types";
import { i18n } from "./i18n";
import { mapAppLocaleToLanguage } from "./language";

export const AppLanguageSync = () => {
  const appSettingsQuery = useAppSettingsQuery();
  const locale = appSettingsQuery.data?.locale ?? DEFAULT_APP_SETTINGS.locale;

  useEffect(() => {
    const nextLanguage = mapAppLocaleToLanguage(locale);
    if (i18n.language !== nextLanguage) {
      void i18n.changeLanguage(nextLanguage);
    }
  }, [locale]);

  return null;
};
