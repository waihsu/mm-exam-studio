import React from "react";
import { Pressable, Text } from "react-native";
import { useTranslation } from "@/i18n";
import { useUpdateAppSettingsMutation } from "../hooks/use-update-app-settings-mutation";
import { useAppSettingsQuery } from "../hooks/use-app-settings-query";
import {
  DEFAULT_APP_SETTINGS,
  type AppDateFormat,
  type AppLocale,
  type AppTimeZone,
} from "../types/settings.types";
import { formatDateTimeWithSettings } from "../utils/date-time-format";
import {
  DATE_FORMAT_OPTIONS,
  getLocaleOptions,
  getTimeZoneOptions,
} from "../utils/settings-options";
import { OptionRow, SettingsCard, SettingsPage } from "./settings-ui";
import { settingsUiStyles } from "./settings-ui.styles";

export const SettingsPreferencesScreen = () => {
  const { t } = useTranslation(["settings", "common"]);
  const appSettingsQuery = useAppSettingsQuery();
  const updateSettingsMutation = useUpdateAppSettingsMutation();
  const settings = appSettingsQuery.data ?? DEFAULT_APP_SETTINGS;
  const localeOptions = getLocaleOptions(t);
  const timeZoneOptions = getTimeZoneOptions(t);

  const updateSettings = (payload: Partial<typeof settings>) => {
    if (updateSettingsMutation.isPending) {
      return;
    }
    updateSettingsMutation.mutate(payload);
  };

  return (
    <SettingsPage
      title={t("settings:preferences.title")}
      subtitle={t("settings:preferences.subtitle")}
      showBack
    >
      <SettingsCard>
        <Text style={settingsUiStyles.cardTitle}>{t("settings:preferences.localeTime")}</Text>
        <Text style={settingsUiStyles.settingLabel}>{t("settings:preferences.language")}</Text>
        <OptionRow
          disabled={updateSettingsMutation.isPending}
          options={localeOptions}
          selectedValue={settings.locale}
          onPress={(value) => updateSettings({ locale: value as AppLocale })}
        />
        <Text style={settingsUiStyles.settingLabel}>{t("settings:preferences.timeZone")}</Text>
        <OptionRow
          disabled={updateSettingsMutation.isPending}
          options={timeZoneOptions}
          selectedValue={settings.timeZone}
          onPress={(value) => updateSettings({ timeZone: value as AppTimeZone })}
        />
        <Text style={settingsUiStyles.settingLabel}>{t("settings:preferences.dateFormat")}</Text>
        <OptionRow
          disabled={updateSettingsMutation.isPending}
          options={DATE_FORMAT_OPTIONS}
          selectedValue={settings.dateFormat}
          onPress={(value) => updateSettings({ dateFormat: value as AppDateFormat })}
        />
        <Pressable
          disabled={updateSettingsMutation.isPending}
          style={({ pressed }) => [
            settingsUiStyles.settingRow,
            updateSettingsMutation.isPending && settingsUiStyles.buttonDisabled,
            pressed && !updateSettingsMutation.isPending && settingsUiStyles.buttonPressed,
          ]}
          onPress={() => updateSettings({ use24HourClock: !settings.use24HourClock })}
        >
          <Text style={settingsUiStyles.settingTitle}>{t("settings:preferences.twentyFourHour")}</Text>
          <Text style={settingsUiStyles.settingValue}>
            {settings.use24HourClock ? t("common:states.on") : t("common:states.off")}
          </Text>
        </Pressable>
        <Text style={settingsUiStyles.metaText}>
          {t("settings:preferences.preview", {
            value: formatDateTimeWithSettings(new Date().toISOString(), settings),
          })}
        </Text>
      </SettingsCard>

      <SettingsCard>
        <Text style={settingsUiStyles.cardTitle}>{t("settings:preferences.practiceDefaults")}</Text>
        <Pressable
          disabled={updateSettingsMutation.isPending}
          style={({ pressed }) => [
            settingsUiStyles.settingRow,
            updateSettingsMutation.isPending && settingsUiStyles.buttonDisabled,
            pressed && !updateSettingsMutation.isPending && settingsUiStyles.buttonPressed,
          ]}
          onPress={() =>
            updateSettings({ autoSavePracticeDrafts: !settings.autoSavePracticeDrafts })
          }
        >
          <Text style={settingsUiStyles.settingTitle}>{t("settings:preferences.autoSaveDrafts")}</Text>
          <Text style={settingsUiStyles.settingValue}>
            {settings.autoSavePracticeDrafts ? t("common:states.on") : t("common:states.off")}
          </Text>
        </Pressable>
        <Pressable
          disabled={updateSettingsMutation.isPending}
          style={({ pressed }) => [
            settingsUiStyles.settingRow,
            updateSettingsMutation.isPending && settingsUiStyles.buttonDisabled,
            pressed && !updateSettingsMutation.isPending && settingsUiStyles.buttonPressed,
          ]}
          onPress={() =>
            updateSettings({ confirmBeforeSubmitPractice: !settings.confirmBeforeSubmitPractice })
          }
        >
          <Text style={settingsUiStyles.settingTitle}>{t("settings:preferences.confirmBeforeSubmit")}</Text>
          <Text style={settingsUiStyles.settingValue}>
            {settings.confirmBeforeSubmitPractice ? t("common:states.on") : t("common:states.off")}
          </Text>
        </Pressable>
      </SettingsCard>
    </SettingsPage>
  );
};
