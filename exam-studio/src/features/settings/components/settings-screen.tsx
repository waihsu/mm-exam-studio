import { useQuery } from "@tanstack/react-query";
import { useRouter, type RelativePathString } from "expo-router";
import { Pressable, RefreshControl, Text, View } from "react-native";
import { useTranslation } from "@/i18n";
import { useAuthSessionQuery } from "@/features/auth/hooks/use-auth-session-query";
import {
  getStoredPracticeDraftCount,
} from "@/features/practice/services/practice-draft-store";
import { useRefreshAction } from "@/hooks/use-refresh-action";
import { useWorkspaceSummaryQuery } from "@/features/workspace/hooks/use-workspace-summary-query";
import { SETTINGS_QUERY_KEYS } from "../constants/query-keys";
import { useAppSettingsQuery } from "../hooks/use-app-settings-query";
import { DEFAULT_APP_SETTINGS } from "../types/settings.types";
import { SettingsPage } from "./settings-ui";
import { settingsUiStyles } from "./settings-ui.styles";

export const SettingsScreen = () => {
  const router = useRouter();
  const { t } = useTranslation(["settings", "common"]);
  const authSessionQuery = useAuthSessionQuery();
  const workspaceSummaryQuery = useWorkspaceSummaryQuery(Boolean(authSessionQuery.data));
  const appSettingsQuery = useAppSettingsQuery();
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
  const userEmail = authSessionQuery.data?.user.email ?? "";
  const notificationSummary = workspaceSummaryQuery.data?.notifications;
  const supportUnreadCount = notificationSummary?.supportUnreadCount ?? 0;
  const reminderState = settings.practiceReminderEnabled ? t("common:states.on") : t("common:states.off");
  const draftCountValue = `${draftsQuery.data ?? 0}`;
  const supportValue =
    supportUnreadCount > 0
      ? t("settings:home.supportUnreadValue", { count: supportUnreadCount })
      : t("common:actions.open");
  const statusMessages = [
    authSessionQuery.isLoading ? t("settings:home.loadingAccount") : null,
    workspaceSummaryQuery.isLoading ? t("settings:home.loadingWorkspace") : null,
    authSessionQuery.isError
      ? authSessionQuery.error instanceof Error
        ? authSessionQuery.error.message
        : t("settings:home.failedAccount")
      : null,
    workspaceSummaryQuery.isError
      ? workspaceSummaryQuery.error instanceof Error
        ? workspaceSummaryQuery.error.message
        : t("settings:home.failedWorkspace")
      : null,
  ].filter((message): message is string => Boolean(message));
  const settingsRefresh = useRefreshAction(async () => {
    await Promise.allSettled([
      workspaceSummaryQuery.refetch(),
      appSettingsQuery.refetch(),
      draftsQuery.refetch(),
    ]);
  });

  const accountRows: SettingsHomeLinkItem[] = [
    {
      title: t("settings:home.accountTitle"),
      hint: t("settings:home.accountHint"),
      value: t("common:actions.open"),
      badge: "USER",
      tone: "slate",
      href: "/settings/account" as RelativePathString,
    },
    {
      title: t("settings:home.securityTitle"),
      hint: t("settings:home.securityHint"),
      value: t("common:actions.open"),
      badge: "SAFE",
      tone: "green",
      href: "/settings/security" as RelativePathString,
    },
  ];

  const supportRows: SettingsHomeLinkItem[] = [
    {
      title: t("settings:home.helpTitle"),
      hint: t("settings:home.helpHint"),
      value: t("common:actions.open"),
      badge: "GUIDE",
      tone: "amber",
      href: "/settings/help" as RelativePathString,
    },
    {
      title: t("settings:home.supportTitle"),
      hint: t("settings:home.supportHint"),
      value: supportValue,
      badge: "HELP",
      tone: "green",
      href: "/settings/support" as RelativePathString,
    },
    {
      title: t("settings:home.aboutTitle"),
      hint: t("settings:home.aboutHint"),
      value: t("common:actions.open"),
      badge: "APP",
      tone: "blue",
      href: "/settings/about" as RelativePathString,
    },
    {
      title: t("settings:home.legalTitle"),
      hint: t("settings:home.legalHint"),
      value: t("common:actions.open"),
      badge: "RULE",
      tone: "amber",
      href: "/settings/legal" as RelativePathString,
    },
  ];

  const experienceRows: SettingsHomeLinkItem[] = [
    {
      title: t("settings:home.preferencesTitle"),
      hint: t("settings:home.preferencesHint"),
      value: t("common:actions.open"),
      badge: "APP",
      tone: "purple",
      href: "/settings/preferences" as RelativePathString,
    },
    {
      title: t("settings:home.notificationsTitle"),
      hint: t("settings:home.notificationsHint"),
      value: reminderState,
      badge: "PING",
      tone: "blue",
      href: "/settings/notifications" as RelativePathString,
    },
    {
      title: t("settings:home.storageTitle"),
      hint: t("settings:home.storageHint"),
      value: draftCountValue,
      badge: "SAVE",
      tone: "slate",
      href: "/settings/storage" as RelativePathString,
    },
  ];

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
      <View style={settingsUiStyles.homeSummaryCard}>
        <View style={settingsUiStyles.homeSummaryHeader}>
          <View style={settingsUiStyles.homeSummaryTextWrap}>
            <Text style={settingsUiStyles.homeSummaryName}>{userName}</Text>
            <Text style={settingsUiStyles.homeSummaryEmail}>
              {userEmail || t("settings:home.subtitle")}
            </Text>
          </View>
        </View>

        <View style={settingsUiStyles.homeSummaryMetaRow}>
          <View style={settingsUiStyles.homeSummaryMetaChip}>
            <Text style={settingsUiStyles.homeSummaryMetaLabel}>
              {t("settings:home.reminder", { state: reminderState })}
            </Text>
          </View>
          <View style={settingsUiStyles.homeSummaryMetaChip}>
            <Text style={settingsUiStyles.homeSummaryMetaLabel}>
              {t("settings:home.draftsSaved", { count: draftsQuery.data ?? 0 })}
            </Text>
          </View>
          <View style={settingsUiStyles.homeSummaryMetaChip}>
            <Text style={settingsUiStyles.homeSummaryMetaLabel}>
              {t("settings:home.supportInbox", { count: supportUnreadCount })}
            </Text>
          </View>
        </View>

        {statusMessages.length > 0 ? (
          <View style={settingsUiStyles.homeStatusList}>
            {statusMessages.map((message) => (
              <Text key={message} style={settingsUiStyles.homeSummaryStatusText}>
                {message}
              </Text>
            ))}
          </View>
        ) : null}
      </View>

      <SettingsHomeSection
        title={t("settings:home.accountSectionTitle")}
        hint={t("settings:home.accountSectionHint")}
        items={accountRows}
        onNavigate={(href) => router.push(href)}
      />

      <SettingsHomeSection
        title={t("settings:home.experienceSectionTitle")}
        hint={t("settings:home.experienceSectionHint")}
        items={experienceRows}
        onNavigate={(href) => router.push(href)}
      />

      <SettingsHomeSection
        title={t("settings:home.supportSectionTitle")}
        hint={t("settings:home.supportSectionHint")}
        items={supportRows}
        onNavigate={(href) => router.push(href)}
      />
    </SettingsPage>
  );
};

type SettingsHomeLinkItem = {
  title: string;
  hint: string;
  value: string;
  badge: string;
  tone: HomeTone;
  href: RelativePathString;
};

type HomeTone = "amber" | "blue" | "green" | "purple" | "slate";

const SettingsHomeSection = ({
  title,
  hint,
  items,
  onNavigate,
}: {
  title: string;
  hint: string;
  items: SettingsHomeLinkItem[];
  onNavigate: (href: RelativePathString) => void;
}) => (
  <View style={[settingsUiStyles.card, settingsUiStyles.homeSectionCard]}>
    <View style={settingsUiStyles.homeSectionHeader}>
      <Text style={settingsUiStyles.homeSectionTitle}>{title}</Text>
      <Text style={settingsUiStyles.homeSectionHint}>{hint}</Text>
    </View>

    <View style={settingsUiStyles.homeLinkList}>
      {items.map((item) => (
        <Pressable
          key={item.href}
          style={({ pressed }) => [
            settingsUiStyles.homeLinkRow,
            pressed && settingsUiStyles.buttonPressed,
          ]}
          onPress={() => onNavigate(item.href)}
        >
          <View style={[settingsUiStyles.homeLinkBadge, homeToneStyles[item.tone].badge]}>
            <Text style={[settingsUiStyles.homeLinkBadgeLabel, homeToneStyles[item.tone].badgeLabel]}>
              {item.badge}
            </Text>
          </View>

          <View style={settingsUiStyles.homeLinkTextWrap}>
            <Text style={settingsUiStyles.homeLinkTitle}>{item.title}</Text>
            <Text style={settingsUiStyles.homeLinkHint}>{item.hint}</Text>
          </View>

          <View style={settingsUiStyles.homeLinkMetaWrap}>
            <Text style={settingsUiStyles.homeLinkValue}>{item.value}</Text>
            <Text style={settingsUiStyles.homeLinkChevron}>›</Text>
          </View>
        </Pressable>
      ))}
    </View>
  </View>
);

const homeToneStyles: Record<
  HomeTone,
  {
    badge: object;
    badgeLabel: object;
    card: object;
  }
> = {
  amber: {
    badge: settingsUiStyles.homeToneBadgeAmber,
    badgeLabel: settingsUiStyles.homeToneBadgeLabelAmber,
    card: settingsUiStyles.homeToneCardAmber,
  },
  blue: {
    badge: settingsUiStyles.homeToneBadgeBlue,
    badgeLabel: settingsUiStyles.homeToneBadgeLabelBlue,
    card: settingsUiStyles.homeToneCardBlue,
  },
  green: {
    badge: settingsUiStyles.homeToneBadgeGreen,
    badgeLabel: settingsUiStyles.homeToneBadgeLabelGreen,
    card: settingsUiStyles.homeToneCardGreen,
  },
  purple: {
    badge: settingsUiStyles.homeToneBadgePurple,
    badgeLabel: settingsUiStyles.homeToneBadgeLabelPurple,
    card: settingsUiStyles.homeToneCardPurple,
  },
  slate: {
    badge: settingsUiStyles.homeToneBadgeSlate,
    badgeLabel: settingsUiStyles.homeToneBadgeLabelSlate,
    card: settingsUiStyles.homeToneCardSlate,
  },
};
