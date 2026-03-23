import Constants from "expo-constants";
import React from "react";
import { Text } from "react-native";
import { useTranslation } from "react-i18next";
import { SettingsCard, SettingsPage } from "./settings-ui";
import { settingsUiStyles } from "./settings-ui.styles";

export const SettingsAboutScreen = () => {
  const { t } = useTranslation("settingsDetail");
  const appVersion =
    Constants.expoConfig?.version ?? Constants.nativeAppVersion ?? "1.0.0";

  return (
    <SettingsPage
      title={t("about.title")}
      subtitle={t("about.subtitle")}
      showBack
    >
      <SettingsCard>
        <Text style={settingsUiStyles.cardTitle}>{t("about.appName")}</Text>
        <Text style={settingsUiStyles.metaText}>{t("about.version", { value: appVersion })}</Text>
        <Text style={settingsUiStyles.metaText}>{t("about.overview")}</Text>
      </SettingsCard>

      <SettingsCard>
        <Text style={settingsUiStyles.cardTitle}>{t("about.capabilities")}</Text>
        <Text style={settingsUiStyles.metaText}>{t("about.practice")}</Text>
        <Text style={settingsUiStyles.metaText}>{t("about.papers")}</Text>
        <Text style={settingsUiStyles.metaText}>{t("about.settings")}</Text>
      </SettingsCard>
    </SettingsPage>
  );
};
