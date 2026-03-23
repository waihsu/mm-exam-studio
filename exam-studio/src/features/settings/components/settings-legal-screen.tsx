import React from "react";
import { Text } from "react-native";
import { useTranslation } from "react-i18next";
import { SettingsCard, SettingsPage } from "./settings-ui";
import { settingsUiStyles } from "./settings-ui.styles";

export const SettingsLegalScreen = () => {
  const { t } = useTranslation("settingsDetail");

  return (
    <SettingsPage title={t("legal.title")} subtitle={t("legal.subtitle")} showBack>
      <SettingsCard>
        <Text style={settingsUiStyles.cardTitle}>{t("legal.privacy")}</Text>
        <Text style={settingsUiStyles.metaText}>{t("legal.privacyBody")}</Text>
      </SettingsCard>

      <SettingsCard>
        <Text style={settingsUiStyles.cardTitle}>{t("legal.responsibleUse")}</Text>
        <Text style={settingsUiStyles.metaText}>{t("legal.responsibleUseOne")}</Text>
        <Text style={settingsUiStyles.metaText}>{t("legal.responsibleUseTwo")}</Text>
      </SettingsCard>

      <SettingsCard>
        <Text style={settingsUiStyles.cardTitle}>{t("legal.supportBoundary")}</Text>
        <Text style={settingsUiStyles.metaText}>{t("legal.supportBoundaryBody")}</Text>
      </SettingsCard>
    </SettingsPage>
  );
};
