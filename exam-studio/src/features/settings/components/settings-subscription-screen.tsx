import React from "react";
import { RefreshControl, Text, View } from "react-native";
import { useTranslation } from "@/i18n";
import { useAuthSessionQuery } from "@/features/auth/hooks/use-auth-session-query";
import { useRefreshAction } from "@/hooks/use-refresh-action";
import { useWorkspaceSummaryQuery } from "@/features/workspace/hooks/use-workspace-summary-query";
import { SettingsCard, SettingsPage } from "./settings-ui";
import { settingsUiStyles } from "./settings-ui.styles";

/** Kept at the original route so existing deep links continue to work. */
export const SettingsSubscriptionScreen = () => {
  const { t } = useTranslation("settingsDetail");
  const authSessionQuery = useAuthSessionQuery();
  const workspaceSummaryQuery = useWorkspaceSummaryQuery(Boolean(authSessionQuery.data));
  const refresh = useRefreshAction(async () => {
    await workspaceSummaryQuery.refetch();
  });
  const summary = workspaceSummaryQuery.data;

  return (
    <SettingsPage
      title={t("subscription.title")}
      subtitle={t("subscription.subtitle")}
      showBack
      scrollProps={{
        refreshControl: (
          <RefreshControl refreshing={refresh.refreshing} onRefresh={() => void refresh.onRefresh()} />
        ),
      }}
    >
      <SettingsCard>
        <View style={settingsUiStyles.subscriptionSummaryCard}>
          <Text style={settingsUiStyles.settingTitle}>{t("subscription.accessTitle")}</Text>
          <Text style={settingsUiStyles.settingHint}>{t("subscription.accessHint")}</Text>
        </View>
        <View style={settingsUiStyles.subscriptionFeatureList}>
          {[
            t("subscription.featurePractice"),
            t("subscription.featurePapers"),
            t("subscription.featureSupport"),
          ].map((feature) => (
            <View key={feature} style={settingsUiStyles.subscriptionFeatureRow}>
              <Text style={settingsUiStyles.subscriptionFeatureBullet}>✓</Text>
              <Text style={settingsUiStyles.subscriptionFeatureText}>{feature}</Text>
            </View>
          ))}
        </View>
      </SettingsCard>

      <SettingsCard>
        <Text style={settingsUiStyles.cardTitle}>{t("subscription.workspaceTitle")}</Text>
        <Text style={settingsUiStyles.settingHint}>{t("subscription.workspaceHint")}</Text>
        <View style={settingsUiStyles.subscriptionFeatureList}>
          <View style={settingsUiStyles.settingRow}>
            <View style={settingsUiStyles.settingTextWrap}>
              <Text style={settingsUiStyles.settingTitle}>{t("subscription.publishedQuestions")}</Text>
              <Text style={settingsUiStyles.settingHint}>{t("subscription.publishedQuestionsHint")}</Text>
            </View>
            <Text style={settingsUiStyles.settingValue}>
              {summary ? String(summary.publishedQuestionCount ?? 0) : "—"}
            </Text>
          </View>
        </View>
      </SettingsCard>

      <SettingsCard>
        <Text style={settingsUiStyles.cardTitle}>{t("subscription.openSourceTitle")}</Text>
        <Text style={settingsUiStyles.settingHint}>{t("subscription.openSourceHint")}</Text>
      </SettingsCard>
    </SettingsPage>
  );
};
