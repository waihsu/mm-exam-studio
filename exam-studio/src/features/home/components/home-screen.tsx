import { useRouter, type RelativePathString } from "expo-router";
import React, { useMemo } from "react";
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import { AppShell } from "@/features/app-shell/components/app-shell";
import { useAuthSessionQuery } from "@/features/auth/hooks/use-auth-session-query";
import { useExportedQuestionPapersQuery } from "@/features/papers/hooks/use-exported-question-papers-query";
import { useQuestionPapersQuery } from "@/features/papers/hooks/use-question-papers-query";
import { usePracticeSessionsQuery } from "@/features/practice/hooks/use-practice-sessions-query";
import { useAppDateTimeFormatter } from "@/features/settings/hooks/use-app-date-time-formatter";
import { useSubscriptionPaymentConfigQuery } from "@/features/subscriptions/hooks/use-subscription-payment-config-query";
import { useWorkspaceSummaryQuery } from "@/features/workspace/hooks/use-workspace-summary-query";
import { useRefreshAction } from "@/hooks/use-refresh-action";

const formatNullableCount = (value: number | null, uncappedLabel: string) => {
  if (typeof value !== "number") {
    return uncappedLabel;
  }

  return `${value}`;
};

const HomeSection = ({
  title,
  description,
  actionLabel,
  onActionPress,
  children,
}: {
  title: string;
  description?: string;
  actionLabel?: string;
  onActionPress?: () => void;
  children: React.ReactNode;
}) => (
  <View style={styles.sectionCard}>
    <View style={styles.sectionHeader}>
      <View style={styles.sectionHeaderCopy}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {description ? <Text style={styles.sectionDescription}>{description}</Text> : null}
      </View>
      {actionLabel && onActionPress ? (
        <Pressable
          style={({ pressed }) => [styles.sectionAction, pressed && styles.buttonPressed]}
          onPress={onActionPress}
        >
          <Text style={styles.sectionActionLabel}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
    <View style={styles.sectionBody}>{children}</View>
  </View>
);

const HeroAction = ({
  title,
  tone,
  onPress,
}: {
  title: string;
  tone: "primary" | "secondary";
  onPress: () => void;
}) => (
  <Pressable
    style={({ pressed }) => [
      styles.heroAction,
      tone === "primary" ? styles.heroActionPrimary : styles.heroActionSecondary,
      pressed && styles.buttonPressed,
    ]}
    onPress={onPress}
  >
    <View style={styles.heroActionCopy}>
      <Text
        style={[
          styles.heroActionLabel,
          tone === "primary" ? styles.heroActionLabelPrimary : styles.heroActionLabelSecondary,
        ]}
      >
        {title}
      </Text>
    </View>
  </Pressable>
);

const QuickAction = ({
  title,
  hint,
  accent,
  onPress,
}: {
  title: string;
  hint: string;
  accent: string;
  onPress: () => void;
}) => (
  <Pressable
    style={({ pressed }) => [
      styles.quickActionCard,
      { borderColor: `${accent}33` },
      pressed && styles.buttonPressed,
    ]}
    onPress={onPress}
  >
    <View style={[styles.quickActionAccent, { backgroundColor: accent }]} />
    <View style={styles.quickActionHeader}>
      <Text style={styles.quickActionTitle}>{title}</Text>
      <Text style={styles.quickActionArrow}>›</Text>
    </View>
    <Text style={styles.quickActionHint}>{hint}</Text>
  </Pressable>
);

const HomeMetricCard = ({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: string;
}) => (
  <View
    style={[
      styles.metricCard,
      { borderColor: `${tone}24`, backgroundColor: `${tone}0C` },
    ]}
  >
    <Text style={styles.metricLabel}>{label}</Text>
    <Text style={[styles.metricValue, { color: tone }]}>{value}</Text>
  </View>
);

const MetaPill = ({
  label,
  tone = "default",
}: {
  label: string;
  tone?: "default" | "info" | "success" | "warning";
}) => (
  <View
    style={[
      styles.metaPill,
      tone === "info" ? styles.metaPillInfo : null,
      tone === "success" ? styles.metaPillSuccess : null,
      tone === "warning" ? styles.metaPillWarning : null,
    ]}
  >
    <Text
      style={[
        styles.metaPillLabel,
        tone === "info" ? styles.metaPillLabelInfo : null,
        tone === "success" ? styles.metaPillLabelSuccess : null,
        tone === "warning" ? styles.metaPillLabelWarning : null,
      ]}
    >
      {label}
    </Text>
  </View>
);

const ActivityCard = ({
  title,
  body,
  muted = false,
  onPress,
}: {
  title: string;
  body: string;
  muted?: boolean;
  onPress: () => void;
}) => (
  <Pressable
    style={({ pressed }) => [
      muted ? styles.activityCardMuted : styles.activityCard,
      pressed && styles.buttonPressed,
    ]}
    onPress={onPress}
  >
    <Text style={styles.activityTitle}>{title}</Text>
    <Text style={styles.metaText}>{body}</Text>
  </Pressable>
);

export const HomeScreen = () => {
  const { t } = useTranslation("home");
  const router = useRouter();
  const { formatDateTime } = useAppDateTimeFormatter();
  const authSessionQuery = useAuthSessionQuery();
  const workspaceSummaryQuery = useWorkspaceSummaryQuery(Boolean(authSessionQuery.data));
  const sessionsQuery = usePracticeSessionsQuery(Boolean(authSessionQuery.data));
  const papersQuery = useQuestionPapersQuery();
  const exportedPapersQuery = useExportedQuestionPapersQuery();
  const paymentConfigQuery = useSubscriptionPaymentConfigQuery(Boolean(authSessionQuery.data));
  const homeRefresh = useRefreshAction(async () => {
    await Promise.allSettled([
      workspaceSummaryQuery.refetch(),
      sessionsQuery.refetch(),
      papersQuery.refetch(),
      exportedPapersQuery.refetch(),
    ]);
  });

  const userName =
    authSessionQuery.data?.user.name?.trim() ||
    authSessionQuery.data?.user.email ||
    t("defaultUserName");

  const continueSession = useMemo(
    () => sessionsQuery.data?.rows.find((session) => session.status === "active") ?? null,
    [sessionsQuery.data?.rows],
  );

  const recentCompletedSessions = useMemo(
    () =>
      (sessionsQuery.data?.rows ?? [])
        .filter((session) => session.status === "completed")
        .slice(0, 3),
    [sessionsQuery.data?.rows],
  );

  const recentDraftPapers = useMemo(
    () => (papersQuery.data?.rows ?? []).slice(0, 3),
    [papersQuery.data?.rows],
  );

  const recentExports = useMemo(
    () => (exportedPapersQuery.data?.rows ?? []).slice(0, 2),
    [exportedPapersQuery.data?.rows],
  );

  const summary = workspaceSummaryQuery.data;
  const subscription = summary?.subscription;
  const latestRequest = subscription?.latestRequest;
  const notifications = summary?.notifications;
  const supportConversation = notifications?.supportConversation;
  const hasUnreadNotifications = (notifications?.unreadCount ?? 0) > 0;
  const hasSupportUnread = (notifications?.supportUnreadCount ?? 0) > 0;
  const hasPendingSubscriptionRequest = notifications?.hasPendingSubscriptionRequest ?? false;
  const primaryPracticeTitle = continueSession
    ? t("quickActions.continuePractice.title")
    : t("quickActions.startPractice.title");
  return (
    <AppShell>
      <ScrollView
        alwaysBounceVertical
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={homeRefresh.refreshing}
            onRefresh={() => {
              void homeRefresh.onRefresh();
            }}
          />
        }
      >
        <View style={styles.heroCard}>
          <View style={styles.heroTopRow}>
            <View style={styles.heroTitleWrap}>
              <Text style={styles.eyebrow}>{t("appName")}</Text>
              <Text style={styles.heroTitle}>{t("welcomeBack", { name: userName })}</Text>
              <Text style={styles.heroSubtitle}>{t("heroSubtitle")}</Text>
            </View>
            <Text style={styles.heroPlanPill}>{subscription?.name ?? "Free"}</Text>
          </View>
          <View style={styles.heroBadgeRow}>
            <MetaPill
              label={continueSession ? t("sessionReady") : t("newWorkReady")}
              tone="success"
            />
            {hasUnreadNotifications ? (
              <MetaPill
                label={t("notificationsBadge", {
                  count: notifications?.unreadCount ?? 0,
                })}
                tone="info"
              />
            ) : null}
            {hasPendingSubscriptionRequest ? (
              <MetaPill label={t("pendingUpgradeBadge")} tone="warning" />
            ) : null}
          </View>
          <View style={styles.heroActionRow}>
            <HeroAction
              title={primaryPracticeTitle}
              tone="primary"
              onPress={() =>
                router.push(
                  continueSession
                    ? (`/practice/${continueSession.id}` as RelativePathString)
                    : ("/practice" as RelativePathString),
                )
              }
            />
            <HeroAction
              title={t("quickActions.buildPaper.title")}
              tone="secondary"
              onPress={() => router.push("/papers" as RelativePathString)}
            />
          </View>
        </View>

        <HomeSection title={t("snapshot.title")} description={t("usage.planName", { name: subscription?.name ?? "Free" })}>
          <View style={styles.metricsGrid}>
            <HomeMetricCard
              label={t("snapshot.publishedQuestions")}
              value={`${summary?.publishedQuestionCount ?? 0}`}
              tone="#2563EB"
            />
            <HomeMetricCard
              label={t("snapshot.practiceSessions")}
              value={`${summary?.practiceSessionsCount ?? 0}`}
              tone="#0F766E"
            />
            <HomeMetricCard
              label={t("snapshot.draftPapers")}
              value={`${summary?.papersCount ?? 0}`}
              tone="#C2410C"
            />
            <HomeMetricCard
              label={t("snapshot.pdfExports")}
              value={`${summary?.exportedPapersCount ?? 0}`}
              tone="#7C3AED"
            />
          </View>
        </HomeSection>

        <HomeSection
          title={t("usage.title")}
          description={t("usage.planName", { name: subscription?.name ?? "Free" })}
          actionLabel={t("quickActions.managePlan.title")}
          onActionPress={() => router.push("/settings/subscription" as RelativePathString)}
        >
          <View style={styles.usageBanner}>
            <View style={styles.usageBannerCopy}>
              <Text style={styles.usageBannerLabel}>{t("planBadge", { name: subscription?.name ?? "Free" })}</Text>
              <Text style={styles.usageBannerTitle}>{t("quickActions.managePlan.hint")}</Text>
            </View>
            <Text style={styles.usageBannerValue}>
              {formatNullableCount(subscription?.remaining.pdfExports ?? null, t("noCap"))}
            </Text>
          </View>
          <View style={styles.usageGrid}>
            <View style={styles.usageCard}>
              <Text style={styles.usageValue}>
                {formatNullableCount(subscription?.remaining.pdfExports ?? null, t("noCap"))}
              </Text>
              <Text style={styles.usageLabel}>{t("usage.pdfExportsLeftLabel")}</Text>
            </View>
            <View style={styles.usageCard}>
              <Text style={styles.usageValue}>
                {formatNullableCount(
                  subscription?.remaining.paperGenerations ?? null,
                  t("noCap"),
                )}
              </Text>
              <Text style={styles.usageLabel}>{t("usage.paperGenerationsLeftLabel")}</Text>
            </View>
            <View style={styles.usageCard}>
              <Text style={styles.usageValue}>
                {formatNullableCount(subscription?.remaining.paperSwaps ?? null, t("noCap"))}
              </Text>
              <Text style={styles.usageLabel}>{t("usage.paperSwapsLeftLabel")}</Text>
            </View>
            <View style={styles.usageCard}>
              <Text style={styles.usageValue}>{subscription?.limits.deviceLimit ?? 1}</Text>
              <Text style={styles.usageLabel}>{t("usage.deviceLimitLabel")}</Text>
            </View>
          </View>
          {latestRequest ? (
            <View style={styles.inlineNotice}>
              <Text style={styles.inlineNoticeTitle}>{t("usage.latestRequest")}</Text>
              <Text style={styles.metaText}>
                {t("usage.latestRequestMeta", {
                  plan: latestRequest.requestedPlanCode,
                  status: latestRequest.status,
                  createdAt: formatDateTime(latestRequest.createdAt),
                })}
              </Text>
            </View>
          ) : null}
        </HomeSection>

        <HomeSection title={t("quickActions.title")} description={t("homeSectionHints.actions")}>
          <View style={styles.quickActionGrid}>
            {continueSession ? (
              <QuickAction
                title={t("quickActions.continuePractice.title")}
                hint={t("quickActions.continuePractice.hint", {
                  title: continueSession.title,
                  count: continueSession.totalQuestions,
                })}
                accent="#2563EB"
                onPress={() =>
                  router.push(`/practice/${continueSession.id}` as RelativePathString)
                }
              />
            ) : (
              <QuickAction
                title={t("quickActions.startPractice.title")}
                hint={t("quickActions.startPractice.hint")}
                accent="#2563EB"
                onPress={() => router.push("/practice" as RelativePathString)}
              />
            )}
            <QuickAction
              title={t("quickActions.buildPaper.title")}
              hint={t("quickActions.buildPaper.hint")}
              accent="#0F766E"
              onPress={() => router.push("/papers" as RelativePathString)}
            />
            <QuickAction
              title={t("quickActions.managePlan.title")}
              hint={t("quickActions.managePlan.hint")}
              accent="#B45309"
              onPress={() => router.push("/settings/subscription" as RelativePathString)}
            />
            <QuickAction
              title={t("quickActions.needHelp.title")}
              hint={
                hasSupportUnread
                  ? t("quickActions.needHelp.unreadHint", {
                      count: notifications?.supportUnreadCount ?? 0,
                    })
                  : t("quickActions.needHelp.hint")
              }
              accent="#7C3AED"
              onPress={() => router.push("/settings/support" as RelativePathString)}
            />
          </View>
        </HomeSection>

        <HomeSection
          title={t("recentActivity.title")}
          description={t("homeSectionHints.practice")}
          actionLabel={t("quickActions.startPractice.title")}
          onActionPress={() => router.push("/practice" as RelativePathString)}
        >
          <View style={styles.stack}>
            {continueSession ? (
              <ActivityCard
                title={t("recentActivity.continueLabel", { title: continueSession.title })}
                body={t("recentActivity.startedMeta", {
                  startedAt: formatDateTime(continueSession.startedAt),
                  count: continueSession.totalQuestions,
                })}
                onPress={() => router.push(`/practice/${continueSession.id}` as RelativePathString)}
              />
            ) : null}
            {recentCompletedSessions.map((session) => (
              <ActivityCard
                key={session.id}
                title={session.title}
                body={t("recentActivity.scoreMeta", {
                  score:
                    typeof session.scorePercent === "number"
                      ? `${session.scorePercent.toFixed(1)}%`
                      : "-",
                  date: session.completedAt
                    ? formatDateTime(session.completedAt)
                    : formatDateTime(session.startedAt),
                })}
                onPress={() => router.push(`/practice/${session.id}` as RelativePathString)}
              />
            ))}
            {!continueSession && recentCompletedSessions.length === 0 ? (
              <View style={styles.emptyCard}>
                <Text style={styles.cardTitle}>{t("recentActivity.noneTitle")}</Text>
                <Text style={styles.metaText}>{t("recentActivity.noneBody")}</Text>
              </View>
            ) : null}
          </View>
        </HomeSection>

        <HomeSection
          title={t("papers.title")}
          description={t("homeSectionHints.papers")}
          actionLabel={t("quickActions.buildPaper.title")}
          onActionPress={() => router.push("/papers" as RelativePathString)}
        >
          <View style={styles.stack}>
            {recentDraftPapers.map((paper) => (
              <ActivityCard
                key={paper.id}
                title={paper.title}
                body={t("papers.draftMeta", {
                  count: paper.totalQuestions,
                  marks: paper.totalMarks,
                  updatedAt: formatDateTime(paper.updatedAt),
                })}
                onPress={() => router.push(`/papers/${paper.id}` as RelativePathString)}
              />
            ))}
            {recentExports.map((paper) => (
              <ActivityCard
                key={`export-${paper.id}`}
                title={t("papers.exportedTitle", { title: paper.title })}
                body={t("papers.exportedMeta", {
                  when: paper.exportedAt ? formatDateTime(paper.exportedAt) : t("papers.ready"),
                  count: paper.totalQuestions,
                })}
                muted
                onPress={() => router.push(`/papers/${paper.id}` as RelativePathString)}
              />
            ))}
            {recentDraftPapers.length === 0 && recentExports.length === 0 ? (
              <View style={styles.emptyCard}>
                <Text style={styles.cardTitle}>{t("papers.noneTitle")}</Text>
                <Text style={styles.metaText}>{t("papers.noneBody")}</Text>
              </View>
            ) : null}
          </View>
        </HomeSection>

        <HomeSection
          title={t("support.title")}
          description={t("support.cardTitle")}
          actionLabel={t("quickActions.needHelp.title")}
          onActionPress={() => router.push("/settings/support" as RelativePathString)}
        >
          <View style={styles.supportCard}>
            {hasSupportUnread && supportConversation?.lastMessagePreview ? (
              <View style={styles.inlineNotice}>
                <Text style={styles.inlineNoticeTitle}>{t("support.newReplyTitle")}</Text>
                <Text style={styles.metaText}>
                  {t("support.newReplyBody", {
                    count: notifications?.supportUnreadCount ?? 0,
                    preview: supportConversation.lastMessagePreview,
                  })}
                </Text>
              </View>
            ) : null}
            {hasPendingSubscriptionRequest ? (
              <View style={styles.inlineNotice}>
                <Text style={styles.inlineNoticeTitle}>{t("support.pendingRequestTitle")}</Text>
                <Text style={styles.metaText}>{t("support.pendingRequestBody")}</Text>
              </View>
            ) : null}
            <Text style={styles.metaText}>
              {t("support.paymentHelp", {
                value:
                  paymentConfigQuery.data?.supportContact ??
                  paymentConfigQuery.data?.supportLabel ??
                  t("support.configuredInSettings"),
              })}
            </Text>
            <View style={styles.linkRow}>
              <Pressable
                style={({ pressed }) => [styles.inlineLink, pressed && styles.buttonPressed]}
                onPress={() => router.push("/settings/help" as RelativePathString)}
              >
                <Text style={styles.inlineLinkLabel}>{t("support.howToUse")}</Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [styles.inlineLink, pressed && styles.buttonPressed]}
                onPress={() => router.push("/settings/support" as RelativePathString)}
              >
                <Text style={styles.inlineLinkLabel}>{t("support.support")}</Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [styles.inlineLink, pressed && styles.buttonPressed]}
                onPress={() => router.push("/settings/legal" as RelativePathString)}
              >
                <Text style={styles.inlineLinkLabel}>{t("support.legal")}</Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [styles.inlineLink, pressed && styles.buttonPressed]}
                onPress={() => router.push("/settings/about" as RelativePathString)}
              >
                <Text style={styles.inlineLinkLabel}>{t("support.about")}</Text>
              </Pressable>
            </View>
          </View>
        </HomeSection>
      </ScrollView>
    </AppShell>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    gap: 16,
    paddingBottom: 24,
  },
  heroCard: {
    backgroundColor: "#111B39",
    borderColor: "#20315F",
    borderRadius: 24,
    borderWidth: 1,
    gap: 14,
    padding: 18,
  },
  heroTopRow: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-between",
  },
  heroTitleWrap: {
    flex: 1,
    gap: 8,
  },
  eyebrow: {
    color: "#AFC8FF",
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  heroTitle: {
    color: "#FFFFFF",
    fontSize: 28,
    fontWeight: "800",
    lineHeight: 34,
  },
  heroSubtitle: {
    color: "#CBD5E1",
    fontSize: 14,
    lineHeight: 21,
  },
  heroPlanPill: {
    alignSelf: "flex-start",
    backgroundColor: "#ECFDF5",
    borderRadius: 999,
    color: "#047857",
    fontSize: 12,
    fontWeight: "800",
    overflow: "hidden",
    paddingHorizontal: 11,
    paddingVertical: 6,
  },
  heroBadgeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  heroSpotlightCard: {
    backgroundColor: "#162451",
    borderColor: "#2B3C70",
    borderRadius: 22,
    borderWidth: 1,
    gap: 14,
    padding: 16,
  },
  heroSpotlightHeader: {
    gap: 14,
  },
  heroSpotlightCopy: {
    gap: 6,
  },
  heroSpotlightEyebrow: {
    color: "#93C5FD",
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.7,
    textTransform: "uppercase",
  },
  heroSpotlightTitle: {
    color: "#FFFFFF",
    fontSize: 21,
    fontWeight: "800",
    lineHeight: 27,
  },
  heroSpotlightBody: {
    color: "#CBD5E1",
    fontSize: 13,
    lineHeight: 19,
  },
  heroSpotlightMetrics: {
    flexDirection: "row",
    gap: 10,
  },
  heroMiniMetric: {
    backgroundColor: "#0F1B42",
    borderColor: "#304272",
    borderRadius: 16,
    borderWidth: 1,
    flex: 1,
    gap: 4,
    padding: 12,
  },
  heroMiniMetricValue: {
    color: "#FFFFFF",
    fontSize: 22,
    fontWeight: "800",
  },
  heroMiniMetricLabel: {
    color: "#AFC8FF",
    fontSize: 11,
    fontWeight: "700",
    lineHeight: 16,
    textTransform: "uppercase",
  },
  heroActionRow: {
    flexDirection: "row",
    gap: 10,
  },
  heroAction: {
    alignItems: "center",
    borderRadius: 16,
    flex: 1,
    justifyContent: "center",
    minHeight: 52,
    paddingHorizontal: 14,
    paddingVertical: 11,
  },
  heroActionPrimary: {
    backgroundColor: "#2563EB",
  },
  heroActionSecondary: {
    backgroundColor: "#F8FAFC",
  },
  heroActionCopy: {
    alignItems: "center",
  },
  heroActionLabel: {
    fontSize: 14,
    fontWeight: "800",
  },
  heroActionLabelPrimary: {
    color: "#FFFFFF",
  },
  heroActionLabelSecondary: {
    color: "#0F172A",
  },
  metaPill: {
    backgroundColor: "#1E2B4F",
    borderColor: "#2F447B",
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  metaPillInfo: {
    backgroundColor: "#132E67",
    borderColor: "#355DB1",
  },
  metaPillSuccess: {
    backgroundColor: "#103A2E",
    borderColor: "#1E7A57",
  },
  metaPillWarning: {
    backgroundColor: "#4A2B13",
    borderColor: "#A16207",
  },
  metaPillLabel: {
    color: "#E2E8F0",
    fontSize: 12,
    fontWeight: "700",
  },
  metaPillLabelInfo: {
    color: "#DBEAFE",
  },
  metaPillLabelSuccess: {
    color: "#D1FAE5",
  },
  metaPillLabelWarning: {
    color: "#FDE68A",
  },
  metricsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  metricCard: {
    borderRadius: 18,
    borderWidth: 1,
    flexBasis: 0,
    flexGrow: 1,
    minWidth: "47%",
    padding: 16,
  },
  metricValue: {
    fontSize: 24,
    fontWeight: "800",
    marginTop: 6,
  },
  metricLabel: {
    color: "#64748B",
    fontSize: 12,
    fontWeight: "700",
    lineHeight: 18,
    textTransform: "uppercase",
  },
  sectionCard: {
    borderRadius: 18,
    borderWidth: 1,
    backgroundColor: "#FFFFFF",
    borderColor: "#D8DEE9",
    padding: 16,
  },
  sectionHeader: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-between",
  },
  sectionHeaderCopy: {
    flex: 1,
    gap: 4,
  },
  sectionTitle: {
    color: "#0F172A",
    fontSize: 18,
    fontWeight: "800",
  },
  sectionDescription: {
    color: "#64748B",
    fontSize: 13,
    lineHeight: 19,
  },
  sectionAction: {
    backgroundColor: "#F8FAFC",
    borderColor: "#D8DEE9",
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  sectionActionLabel: {
    color: "#0F172A",
    fontSize: 12,
    fontWeight: "800",
  },
  sectionBody: {
    gap: 12,
    marginTop: 14,
  },
  quickActionGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  quickActionCard: {
    backgroundColor: "#FBFCFE",
    borderRadius: 18,
    borderWidth: 1,
    flexBasis: 0,
    flexGrow: 1,
    gap: 10,
    minWidth: "47%",
    overflow: "hidden",
    padding: 14,
  },
  quickActionAccent: {
    borderRadius: 999,
    height: 6,
    width: 42,
  },
  quickActionHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
    justifyContent: "space-between",
  },
  quickActionTitle: {
    color: "#111827",
    fontSize: 15,
    fontWeight: "800",
  },
  quickActionArrow: {
    color: "#94A3B8",
    fontSize: 18,
    fontWeight: "700",
    lineHeight: 18,
  },
  quickActionHint: {
    color: "#475569",
    fontSize: 13,
    lineHeight: 19,
  },
  usageBanner: {
    alignItems: "center",
    backgroundColor: "#EFF6FF",
    borderColor: "#BFDBFE",
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-between",
    padding: 14,
  },
  usageBannerCopy: {
    flex: 1,
    gap: 5,
  },
  usageBannerLabel: {
    color: "#1D4ED8",
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  usageBannerTitle: {
    color: "#0F172A",
    fontSize: 15,
    fontWeight: "700",
    lineHeight: 21,
  },
  usageBannerValue: {
    color: "#2563EB",
    fontSize: 28,
    fontWeight: "800",
  },
  usageGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  usageCard: {
    backgroundColor: "#FBFCFE",
    borderColor: "#D8DEE9",
    borderRadius: 18,
    borderWidth: 1,
    flexBasis: 0,
    flexGrow: 1,
    minWidth: "47%",
    padding: 14,
  },
  usageValue: {
    color: "#0F172A",
    fontSize: 20,
    fontWeight: "800",
  },
  usageLabel: {
    color: "#64748B",
    fontSize: 12,
    fontWeight: "700",
    lineHeight: 18,
    marginTop: 6,
  },
  inlineNotice: {
    backgroundColor: "#F8FAFC",
    borderColor: "#CBD5E1",
    borderRadius: 14,
    borderWidth: 1,
    gap: 4,
    padding: 12,
  },
  inlineNoticeTitle: {
    color: "#1D4ED8",
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  stack: {
    gap: 10,
  },
  activityCard: {
    backgroundColor: "#FFFFFF",
    borderColor: "#D8DEE9",
    borderRadius: 16,
    borderWidth: 1,
    gap: 5,
    padding: 14,
  },
  activityCardMuted: {
    backgroundColor: "#F8FAFC",
    borderColor: "#E2E8F0",
    borderRadius: 16,
    borderWidth: 1,
    gap: 5,
    padding: 14,
  },
  activityTitle: {
    color: "#111827",
    fontSize: 14,
    fontWeight: "800",
  },
  emptyCard: {
    backgroundColor: "#F8FAFC",
    borderColor: "#E2E8F0",
    borderRadius: 16,
    borderWidth: 1,
    gap: 6,
    padding: 14,
  },
  supportCard: {
    gap: 10,
  },
  cardTitle: {
    color: "#0F172A",
    fontSize: 15,
    fontWeight: "800",
  },
  metaText: {
    color: "#475569",
    fontSize: 13,
    lineHeight: 19,
  },
  linkRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 2,
  },
  inlineLink: {
    backgroundColor: "#EFF6FF",
    borderColor: "#BFDBFE",
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  inlineLinkLabel: {
    color: "#1D4ED8",
    fontSize: 12,
    fontWeight: "700",
  },
  buttonPressed: {
    opacity: 0.86,
  },
});
