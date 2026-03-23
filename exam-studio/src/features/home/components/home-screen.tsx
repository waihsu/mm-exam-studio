import { useRouter, type RelativePathString } from "expo-router";
import React, { useMemo } from "react";
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import { AppShell } from "@/features/app-shell/components/app-shell";
import { usePracticeSessionsQuery } from "@/features/practice/hooks/use-practice-sessions-query";
import { useAuthSessionQuery } from "@/features/auth/hooks/use-auth-session-query";
import { useExportedQuestionPapersQuery } from "@/features/papers/hooks/use-exported-question-papers-query";
import { useQuestionPapersQuery } from "@/features/papers/hooks/use-question-papers-query";
import { useRefreshAction } from "@/hooks/use-refresh-action";
import { useAppDateTimeFormatter } from "@/features/settings/hooks/use-app-date-time-formatter";
import { useSubscriptionPaymentConfigQuery } from "@/features/subscriptions/hooks/use-subscription-payment-config-query";
import { useWorkspaceSummaryQuery } from "@/features/workspace/hooks/use-workspace-summary-query";

const formatNullableCount = (value: number | null, uncappedLabel: string) => {
  if (typeof value !== "number") {
    return uncappedLabel;
  }

  return `${value}`;
};

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
      { borderColor: accent },
      pressed && styles.buttonPressed,
    ]}
    onPress={onPress}
  >
    <Text style={[styles.quickActionTitle, { color: accent }]}>{title}</Text>
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
  <View style={[styles.metricCard, { borderColor: tone }]}>
    <Text style={[styles.metricValue, { color: tone }]}>{value}</Text>
    <Text style={styles.metricLabel}>{label}</Text>
  </View>
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
      authSessionQuery.refetch(),
      workspaceSummaryQuery.refetch(),
      sessionsQuery.refetch(),
      papersQuery.refetch(),
      exportedPapersQuery.refetch(),
      paymentConfigQuery.refetch(),
    ]);
  });

  const userName =
    authSessionQuery.data?.user.name?.trim() ||
    authSessionQuery.data?.user.email ||
    t("defaultUserName");

  const continueSession = useMemo(
    () => sessionsQuery.data?.rows.find((session) => session.status === "started") ?? null,
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
          <Text style={styles.eyebrow}>{t("appName")}</Text>
          <Text style={styles.heroTitle}>{t("welcomeBack", { name: userName })}</Text>
          <Text style={styles.heroSubtitle}>{t("heroSubtitle")}</Text>
          <View style={styles.heroBadgeRow}>
            <View style={styles.heroBadge}>
              <Text style={styles.heroBadgeLabel}>
                {t("planBadge", { name: subscription?.name ?? "Free" })}
              </Text>
            </View>
            <View style={styles.heroBadge}>
              <Text style={styles.heroBadgeLabel}>
                {continueSession ? t("sessionReady") : t("newWorkReady")}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t("quickActions.title")}</Text>
          <View style={styles.quickActionGrid}>
            {continueSession ? (
              <QuickAction
                title={t("quickActions.continuePractice.title")}
                hint={t("quickActions.continuePractice.hint", {
                  title: continueSession.title,
                  count: continueSession.totalQuestions,
                })}
                accent="#1D4ED8"
                onPress={() =>
                  router.push(`/practice/${continueSession.id}` as RelativePathString)
                }
              />
            ) : (
              <QuickAction
                title={t("quickActions.startPractice.title")}
                hint={t("quickActions.startPractice.hint")}
                accent="#1D4ED8"
                onPress={() => router.push("/practice" as RelativePathString)}
              />
            )}
            <QuickAction
              title={t("quickActions.buildPaper.title")}
              hint={t("quickActions.buildPaper.hint")}
              accent="#047857"
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
              hint={t("quickActions.needHelp.hint")}
              accent="#7C3AED"
              onPress={() => router.push("/settings/support" as RelativePathString)}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t("snapshot.title")}</Text>
          <View style={styles.metricsGrid}>
            <HomeMetricCard
              label={t("snapshot.publishedQuestions")}
              value={`${summary?.publishedQuestionCount ?? 0}`}
              tone="#1D4ED8"
            />
            <HomeMetricCard
              label={t("snapshot.practiceSessions")}
              value={`${summary?.practiceSessionsCount ?? 0}`}
              tone="#047857"
            />
            <HomeMetricCard
              label={t("snapshot.draftPapers")}
              value={`${summary?.papersCount ?? 0}`}
              tone="#B45309"
            />
            <HomeMetricCard
              label={t("snapshot.pdfExports")}
              value={`${summary?.exportedPapersCount ?? 0}`}
              tone="#7C3AED"
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t("usage.title")}</Text>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{t("usage.planName", { name: subscription?.name ?? "Free" })}</Text>
            <Text style={styles.metaText}>
              {t("usage.pdfExportsLeft", {
                count: formatNullableCount(subscription?.remaining.pdfExports ?? null, t("noCap")),
              })}
            </Text>
            <Text style={styles.metaText}>
              {t("usage.paperGenerationsLeft", {
                count: formatNullableCount(subscription?.remaining.paperGenerations ?? null, t("noCap")),
              })}
            </Text>
            <Text style={styles.metaText}>
              {t("usage.paperSwapsLeft", {
                count: formatNullableCount(subscription?.remaining.paperSwaps ?? null, t("noCap")),
              })}
            </Text>
            <Text style={styles.metaText}>
              {t("usage.deviceLimit", { count: subscription?.limits.deviceLimit ?? 1 })}
            </Text>
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
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t("recentActivity.title")}</Text>
          {continueSession ? (
            <Pressable
              style={({ pressed }) => [styles.activityCard, pressed && styles.buttonPressed]}
              onPress={() =>
                router.push(`/practice/${continueSession.id}` as RelativePathString)
              }
            >
              <Text style={styles.activityTitle}>
                {t("recentActivity.continueLabel", { title: continueSession.title })}
              </Text>
              <Text style={styles.metaText}>
                {t("recentActivity.startedMeta", {
                  startedAt: formatDateTime(continueSession.startedAt),
                  count: continueSession.totalQuestions,
                })}
              </Text>
            </Pressable>
          ) : null}
          {recentCompletedSessions.map((session) => (
            <Pressable
              key={session.id}
              style={({ pressed }) => [styles.activityCard, pressed && styles.buttonPressed]}
              onPress={() => router.push(`/practice/${session.id}` as RelativePathString)}
            >
              <Text style={styles.activityTitle}>{session.title}</Text>
              <Text style={styles.metaText}>
                {t("recentActivity.scoreMeta", {
                  score:
                    typeof session.scorePercent === "number"
                      ? `${session.scorePercent.toFixed(1)}%`
                      : "-",
                  date: session.completedAt
                    ? formatDateTime(session.completedAt)
                    : formatDateTime(session.startedAt),
                })}
              </Text>
            </Pressable>
          ))}
          {!continueSession && recentCompletedSessions.length === 0 ? (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>{t("recentActivity.noneTitle")}</Text>
              <Text style={styles.metaText}>{t("recentActivity.noneBody")}</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t("papers.title")}</Text>
          {recentDraftPapers.map((paper) => (
            <Pressable
              key={paper.id}
              style={({ pressed }) => [styles.activityCard, pressed && styles.buttonPressed]}
              onPress={() => router.push(`/papers/${paper.id}` as RelativePathString)}
            >
              <Text style={styles.activityTitle}>{paper.title}</Text>
              <Text style={styles.metaText}>
                {t("papers.draftMeta", {
                  count: paper.totalQuestions,
                  marks: paper.totalMarks,
                  updatedAt: formatDateTime(paper.updatedAt),
                })}
              </Text>
            </Pressable>
          ))}
          {recentExports.map((paper) => (
            <Pressable
              key={`export-${paper.id}`}
              style={({ pressed }) => [styles.activityCardMuted, pressed && styles.buttonPressed]}
              onPress={() => router.push(`/papers/${paper.id}` as RelativePathString)}
            >
              <Text style={styles.activityTitle}>{t("papers.exportedTitle", { title: paper.title })}</Text>
              <Text style={styles.metaText}>
                {t("papers.exportedMeta", {
                  when: paper.exportedAt ? formatDateTime(paper.exportedAt) : t("papers.ready"),
                  count: paper.totalQuestions,
                })}
              </Text>
            </Pressable>
          ))}
          {recentDraftPapers.length === 0 && recentExports.length === 0 ? (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>{t("papers.noneTitle")}</Text>
              <Text style={styles.metaText}>{t("papers.noneBody")}</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t("support.title")}</Text>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{t("support.cardTitle")}</Text>
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
        </View>
      </ScrollView>
    </AppShell>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    gap: 18,
    paddingBottom: 24,
  },
  heroCard: {
    backgroundColor: "#0F172A",
    borderRadius: 20,
    gap: 10,
    padding: 18,
  },
  eyebrow: {
    color: "#93C5FD",
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  heroTitle: {
    color: "#FFFFFF",
    fontSize: 28,
    fontWeight: "800",
  },
  heroSubtitle: {
    color: "#CBD5E1",
    fontSize: 14,
    lineHeight: 21,
  },
  heroBadgeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 4,
  },
  heroBadge: {
    backgroundColor: "#1E293B",
    borderColor: "#334155",
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  heroBadgeLabel: {
    color: "#E2E8F0",
    fontSize: 12,
    fontWeight: "700",
  },
  section: {
    gap: 10,
  },
  sectionTitle: {
    color: "#0F172A",
    fontSize: 18,
    fontWeight: "800",
  },
  quickActionGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  quickActionCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    gap: 6,
    minWidth: "48%",
    padding: 14,
    flexGrow: 1,
    flexBasis: 0,
  },
  quickActionTitle: {
    fontSize: 15,
    fontWeight: "800",
  },
  quickActionHint: {
    color: "#475569",
    fontSize: 13,
    lineHeight: 19,
  },
  metricsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  metricCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    flexBasis: 0,
    flexGrow: 1,
    minWidth: "47%",
    padding: 14,
  },
  metricValue: {
    fontSize: 24,
    fontWeight: "800",
  },
  metricLabel: {
    color: "#475569",
    fontSize: 13,
    fontWeight: "600",
    marginTop: 4,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderColor: "#D8DEE9",
    borderRadius: 16,
    borderWidth: 1,
    gap: 8,
    padding: 14,
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
  inlineNotice: {
    backgroundColor: "#F8FAFC",
    borderColor: "#CBD5E1",
    borderRadius: 12,
    borderWidth: 1,
    gap: 4,
    marginTop: 4,
    padding: 10,
  },
  inlineNoticeTitle: {
    color: "#1D4ED8",
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  activityCard: {
    backgroundColor: "#FFFFFF",
    borderColor: "#D8DEE9",
    borderRadius: 14,
    borderWidth: 1,
    gap: 4,
    padding: 14,
  },
  activityCardMuted: {
    backgroundColor: "#F8FAFC",
    borderColor: "#E2E8F0",
    borderRadius: 14,
    borderWidth: 1,
    gap: 4,
    padding: 14,
  },
  activityTitle: {
    color: "#111827",
    fontSize: 14,
    fontWeight: "800",
  },
  linkRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 4,
  },
  inlineLink: {
    backgroundColor: "#EFF6FF",
    borderColor: "#BFDBFE",
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  inlineLinkLabel: {
    color: "#1D4ED8",
    fontSize: 12,
    fontWeight: "700",
  },
  buttonPressed: {
    opacity: 0.85,
  },
});
