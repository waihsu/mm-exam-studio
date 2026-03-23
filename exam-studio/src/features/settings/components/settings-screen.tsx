import { useQuery } from "@tanstack/react-query";
import { useRouter, type RelativePathString } from "expo-router";
import React, { useEffect, useState } from "react";
import { RefreshControl, Text } from "react-native";
import { useTranslation } from "@/i18n";
import { useAuthSessionQuery } from "@/features/auth/hooks/use-auth-session-query";
import { hasSeenAppOnboarding } from "@/features/onboarding/services/app-onboarding-store";
import {
  getStoredPracticeDraftCount,
} from "@/features/practice/services/practice-draft-store";
import { useRefreshAction } from "@/hooks/use-refresh-action";
import { useWorkspaceSummaryQuery } from "@/features/workspace/hooks/use-workspace-summary-query";
import { SETTINGS_QUERY_KEYS } from "../constants/query-keys";
import { useAppSettingsQuery } from "../hooks/use-app-settings-query";
import { DEFAULT_APP_SETTINGS } from "../types/settings.types";
import { SettingsCard, SettingsLinkRow, SettingsLoadingRow, SettingsPage } from "./settings-ui";
import { settingsUiStyles } from "./settings-ui.styles";

export const SettingsScreen = () => {
  const router = useRouter();
  const { t } = useTranslation(["settings", "common"]);
  const authSessionQuery = useAuthSessionQuery();
  const workspaceSummaryQuery = useWorkspaceSummaryQuery(Boolean(authSessionQuery.data));
  const appSettingsQuery = useAppSettingsQuery();
  const [showHelpGuideEntry, setShowHelpGuideEntry] = useState(false);
  const draftsQuery = useQuery({
    queryKey: SETTINGS_QUERY_KEYS.practiceDrafts,
    queryFn: getStoredPracticeDraftCount,
    staleTime: 0,
  });

  const settings = appSettingsQuery.data ?? DEFAULT_APP_SETTINGS;
  const userName =
    authSessionQuery.data?.user.name?.trim() ||
    authSessionQuery.data?.user.email ||
    t("settings:home.defaultUserName");
  const currentSubscription = workspaceSummaryQuery.data?.subscription;
  const settingsRefresh = useRefreshAction(async () => {
    await Promise.allSettled([
      authSessionQuery.refetch(),
      workspaceSummaryQuery.refetch(),
      appSettingsQuery.refetch(),
      draftsQuery.refetch(),
    ]);
  });

  useEffect(() => {
    let cancelled = false;
    const userId = authSessionQuery.data?.user.id;

    if (!userId) {
      setShowHelpGuideEntry(false);
      return;
    }

    const loadGuideVisibility = async () => {
      const seen = await hasSeenAppOnboarding(userId);
      if (!cancelled) {
        setShowHelpGuideEntry(!seen);
      }
    };

    void loadGuideVisibility();

    return () => {
      cancelled = true;
    };
  }, [authSessionQuery.data?.user.id]);

  return (
    <SettingsPage
      title={t("settings:home.title")}
      subtitle={t("settings:home.subtitle")}
      scrollProps={{
        refreshControl: (
          <RefreshControl
            refreshing={settingsRefresh.refreshing}
            onRefresh={() => {
              void settingsRefresh.onRefresh();
            }}
          />
        ),
      }}
    >
      <SettingsCard>
        <Text style={settingsUiStyles.cardTitle}>{t("settings:home.overview")}</Text>
        {authSessionQuery.isLoading ? (
          <SettingsLoadingRow label={t("settings:home.loadingAccount")} />
        ) : null}
        {workspaceSummaryQuery.isLoading ? (
          <SettingsLoadingRow label={t("settings:home.loadingWorkspace")} />
        ) : null}
        {authSessionQuery.isError ? (
          <Text style={settingsUiStyles.errorText}>
            {authSessionQuery.error instanceof Error
              ? authSessionQuery.error.message
              : t("settings:home.failedAccount")}
          </Text>
        ) : null}
        {workspaceSummaryQuery.isError ? (
          <Text style={settingsUiStyles.errorText}>
            {workspaceSummaryQuery.error instanceof Error
              ? workspaceSummaryQuery.error.message
              : t("settings:home.failedWorkspace")}
          </Text>
        ) : null}
        <Text style={settingsUiStyles.summaryBadge}>{userName}</Text>
        <Text style={settingsUiStyles.metaText}>
          {t("settings:home.plan", { name: currentSubscription?.name ?? "-" })}
        </Text>
        <Text style={settingsUiStyles.metaText}>
          {t("settings:home.reminder", {
            state: settings.practiceReminderEnabled ? t("common:states.on") : t("common:states.off"),
          })}
        </Text>
        <Text style={settingsUiStyles.metaText}>
          {t("settings:home.draftsSaved", { count: draftsQuery.data ?? 0 })}
        </Text>
      </SettingsCard>

      <SettingsCard>
        <Text style={settingsUiStyles.cardTitle}>{t("settings:home.manage")}</Text>
        <SettingsLinkRow
          title={t("settings:home.subscriptionTitle")}
          hint={t("settings:home.subscriptionHint")}
          value={currentSubscription?.code === "premium" ? "Premium" : t("common:actions.open")}
          onPress={() => router.push("/settings/subscription" as RelativePathString)}
        />
        {showHelpGuideEntry ? (
          <SettingsLinkRow
            title={t("settings:home.helpTitle")}
            hint={t("settings:home.helpHint")}
            value={t("settings:home.helpNew")}
            onPress={() => router.push("/settings/help" as RelativePathString)}
          />
        ) : null}
        <SettingsLinkRow
          title={t("settings:home.securityTitle")}
          hint={t("settings:home.securityHint")}
          onPress={() => router.push("/settings/security" as RelativePathString)}
        />
        <SettingsLinkRow
          title={t("settings:home.preferencesTitle")}
          hint={t("settings:home.preferencesHint")}
          onPress={() => router.push("/settings/preferences" as RelativePathString)}
        />
        <SettingsLinkRow
          title={t("settings:home.notificationsTitle")}
          hint={t("settings:home.notificationsHint")}
          value={settings.practiceReminderEnabled ? t("common:states.on") : t("common:states.off")}
          onPress={() => router.push("/settings/notifications" as RelativePathString)}
        />
        <SettingsLinkRow
          title={t("settings:home.storageTitle")}
          hint={t("settings:home.storageHint")}
          value={draftsQuery.data ? `${draftsQuery.data}` : t("common:actions.open")}
          onPress={() => router.push("/settings/storage" as RelativePathString)}
        />
        <SettingsLinkRow
          title={t("settings:home.supportTitle")}
          hint={t("settings:home.supportHint")}
          onPress={() => router.push("/settings/support" as RelativePathString)}
        />
        <SettingsLinkRow
          title={t("settings:home.aboutTitle")}
          hint={t("settings:home.aboutHint")}
          onPress={() => router.push("/settings/about" as RelativePathString)}
        />
        <SettingsLinkRow
          title={t("settings:home.legalTitle")}
          hint={t("settings:home.legalHint")}
          onPress={() => router.push("/settings/legal" as RelativePathString)}
        />
        <SettingsLinkRow
          title={t("settings:home.accountTitle")}
          hint={t("settings:home.accountHint")}
          onPress={() => router.push("/settings/account" as RelativePathString)}
        />
      </SettingsCard>
    </SettingsPage>
  );
};
