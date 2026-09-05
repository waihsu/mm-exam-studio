import React, { useMemo } from "react";
import { useRouter, type RelativePathString } from "expo-router";
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import { AppShell } from "@/features/app-shell/components/app-shell";
import { useAuthSessionQuery } from "@/features/auth/hooks/use-auth-session-query";
import { useExportedQuestionPapersQuery } from "@/features/papers/hooks/use-exported-question-papers-query";
import { useQuestionPapersQuery } from "@/features/papers/hooks/use-question-papers-query";
import { usePracticeSessionsQuery } from "@/features/practice/hooks/use-practice-sessions-query";
import { useAppDateTimeFormatter } from "@/features/settings/hooks/use-app-date-time-formatter";
import { useWorkspaceSummaryQuery } from "@/features/workspace/hooks/use-workspace-summary-query";
import { useRefreshAction } from "@/hooks/use-refresh-action";

const COLORS = {
  paper: "#F3EFE6",
  ink: "#202321",
  muted: "#6E706B",
  line: "#D8D4C9",
  sage: "#7FA99D",
  sageSoft: "#E7EFE9",
  terracotta: "#D76F55",
  terracottaSoft: "#F5E4DA",
  lavender: "#A99BF2",
  lavenderSoft: "#EEEAFB",
  lime: "#C8F27A",
  white: "#FFFDF8",
};

type WorkspaceCardProps = {
  title: string;
  body: string;
  glyph: string;
  tone: "sage" | "terracotta" | "lavender";
  onPress: () => void;
};

const toneStyles = {
  sage: {
    backgroundColor: COLORS.sageSoft,
    borderColor: "#C9DCD3",
    color: "#48766B",
  },
  terracotta: {
    backgroundColor: COLORS.terracottaSoft,
    borderColor: "#EAD1C3",
    color: "#AD5948",
  },
  lavender: {
    backgroundColor: COLORS.lavenderSoft,
    borderColor: "#DCD6F4",
    color: "#7668B6",
  },
} as const;

const WorkspaceCard = ({ title, body, glyph, tone, onPress }: WorkspaceCardProps) => {
  const palette = toneStyles[tone];
  return (
    <Pressable
      style={({ pressed }) => [
        styles.workspaceCard,
        {
          backgroundColor: palette.backgroundColor,
          borderColor: palette.borderColor,
        },
        pressed && styles.pressed,
      ]}
      onPress={onPress}
    >
      <View style={[styles.workspaceGlyph, { borderColor: palette.color }]}>
        <Text style={[styles.workspaceGlyphText, { color: palette.color }]}>{glyph}</Text>
      </View>
      <Text style={styles.workspaceTitle}>{title}</Text>
      <Text style={styles.workspaceBody}>{body}</Text>
      <Text style={[styles.workspaceArrow, { color: palette.color }]}>→</Text>
    </Pressable>
  );
};

const SectionHeader = ({ title, detail }: { title: string; detail?: string }) => (
  <View style={styles.sectionHeader}>
    <Text style={styles.sectionTitle}>{title}</Text>
    {detail ? <Text style={styles.sectionDetail}>{detail}</Text> : null}
  </View>
);

const FocusChip = ({ title, tone }: { title: string; tone: "sage" | "terracotta" | "lavender" }) => {
  const palette = toneStyles[tone];
  return (
    <View style={[styles.focusChip, { borderColor: palette.borderColor }]}>
      <View style={[styles.focusDot, { backgroundColor: palette.color }]} />
      <Text style={styles.focusChipLabel} numberOfLines={1}>
        {title}
      </Text>
      <Text style={styles.focusChipArrow}>›</Text>
    </View>
  );
};

const ActivityRow = ({
  title,
  body,
  status,
  onPress,
}: {
  title: string;
  body: string;
  status?: string;
  onPress: () => void;
}) => (
  <Pressable style={({ pressed }) => [styles.activityRow, pressed && styles.pressed]} onPress={onPress}>
    <View style={styles.activityMarker} />
    <View style={styles.activityCopy}>
      <Text style={styles.activityTitle} numberOfLines={1}>
        {title}
      </Text>
      <Text style={styles.activityBody} numberOfLines={2}>
        {body}
      </Text>
    </View>
    {status ? <Text style={styles.activityStatus}>{status}</Text> : null}
    <Text style={styles.activityArrow}>›</Text>
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

  const focusAreas = useMemo(() => {
    const labels = [
      ...(continueSession ? [continueSession.title] : []),
      ...recentCompletedSessions.map((session) => session.title),
      ...recentDraftPapers.map((paper) => paper.title),
    ];
    return Array.from(new Set(labels)).slice(0, 3);
  }, [continueSession, recentCompletedSessions, recentDraftPapers]);

  const summary = workspaceSummaryQuery.data;
  const latestCompletedSession = recentCompletedSessions[0];
  const primaryAction = () => {
    if (continueSession) {
      router.push(`/practice/${continueSession.id}` as RelativePathString);
      return;
    }
    router.push("/practice" as RelativePathString);
  };

  return (
    <AppShell style={styles.shell}>
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
            tintColor={COLORS.sage}
          />
        }
      >
        <View style={styles.topBar}>
          <View>
            <Text style={styles.wordmark}>{t("appName")}</Text>
            <View style={styles.wordmarkRule} />
          </View>
          <View style={styles.profileCircle}>
            <Text style={styles.profileInitial}>{userName.slice(0, 1).toUpperCase()}</Text>
          </View>
        </View>

        <View style={styles.introBlock}>
          <Text style={styles.introEyebrow}>{t("todayEyebrow")}</Text>
          <Text style={styles.introTitle}>{t("todayTitle")}</Text>
          <Text style={styles.introSubtitle}>{t("todaySubtitle", { name: userName })}</Text>
        </View>

        <View style={styles.continueCard}>
          <View style={styles.continueTopRow}>
            <View style={styles.terracottaMarker} />
            <Text style={styles.continueEyebrow}>{t("continueEyebrow")}</Text>
          </View>
          <Text style={styles.continueTitle} numberOfLines={2}>
            {continueSession?.title ?? t("emptyContinueTitle")}
          </Text>
          <Text style={styles.continueMeta}>
            {continueSession
              ? t("continueMeta", { count: continueSession.totalQuestions })
              : t("emptyContinueBody")}
          </Text>
          <View style={styles.continueFooter}>
            <View style={styles.continueRule} />
            <Pressable
              style={({ pressed }) => [styles.resumeButton, pressed && styles.continuePressed]}
              onPress={primaryAction}
            >
              <Text style={styles.resumeLabel}>
                {continueSession ? t("resumeLabel") : t("startLabel")}
              </Text>
              <Text style={styles.resumeArrow}>→</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.sectionBlock}>
          <SectionHeader title={t("workspaceTitle")} />
          <View style={styles.workspaceGrid}>
            <WorkspaceCard
              title={t("workspace.practiceTitle")}
              body={t("workspace.practiceBody")}
              glyph="◎"
              tone="sage"
              onPress={() => router.push("/practice" as RelativePathString)}
            />
            <WorkspaceCard
              title={t("workspace.papersTitle")}
              body={t("workspace.papersBody")}
              glyph="▤"
              tone="terracotta"
              onPress={() => router.push("/papers" as RelativePathString)}
            />
            <WorkspaceCard
              title={t("workspace.reviewTitle")}
              body={t("workspace.reviewBody")}
              glyph="✓"
              tone="lavender"
              onPress={() =>
                router.push(
                  latestCompletedSession
                    ? (`/practice/${latestCompletedSession.id}` as RelativePathString)
                    : ("/practice" as RelativePathString),
                )
              }
            />
          </View>
        </View>

        <View style={styles.sectionBlock}>
          <SectionHeader
            title={t("focusTitle")}
            detail={t("focusDetail")}
          />
          <View style={styles.focusList}>
            {(focusAreas.length > 0 ? focusAreas : [t("focusEmpty")]).map((label, index) => (
              <FocusChip
                key={`${label}-${index}`}
                title={label}
                tone={index % 3 === 0 ? "sage" : index % 3 === 1 ? "terracotta" : "lavender"}
              />
            ))}
          </View>
        </View>

        <View style={styles.pulseCard}>
          <View style={styles.pulseCopy}>
            <Text style={styles.pulseEyebrow}>{t("pulseEyebrow")}</Text>
            <Text style={styles.pulseTitle}>{t("pulseTitle")}</Text>
            <Text style={styles.pulseBody}>{t("pulseBody")}</Text>
          </View>
          <View style={styles.pulseStats}>
            <View style={styles.pulseStat}>
              <Text style={styles.pulseStatValue}>{summary?.practiceSessionsCount ?? 0}</Text>
              <Text style={styles.pulseStatLabel}>{t("pulsePracticeLabel")}</Text>
            </View>
            <View style={styles.pulseDivider} />
            <View style={styles.pulseStat}>
              <Text style={styles.pulseStatValue}>{summary?.papersCount ?? 0}</Text>
              <Text style={styles.pulseStatLabel}>{t("pulsePaperLabel")}</Text>
            </View>
          </View>
        </View>

        <View style={styles.sectionBlock}>
          <SectionHeader title={t("recentActivity.title")} detail={t("recentActivityDetail")} />
          <View style={styles.activityList}>
            {continueSession ? (
              <ActivityRow
                title={t("recentActivity.continueLabel", { title: continueSession.title })}
                body={t("recentActivity.startedMeta", {
                  startedAt: formatDateTime(continueSession.startedAt),
                  count: continueSession.totalQuestions,
                })}
                status={t("activityInProgress")}
                onPress={() => router.push(`/practice/${continueSession.id}` as RelativePathString)}
              />
            ) : null}
            {recentCompletedSessions.map((session) => (
              <ActivityRow
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
                status={t("activityCompleted")}
                onPress={() => router.push(`/practice/${session.id}` as RelativePathString)}
              />
            ))}
            {!continueSession && recentCompletedSessions.length === 0 ? (
              <View style={styles.emptyActivity}>
                <Text style={styles.emptyActivityTitle}>{t("recentActivity.noneTitle")}</Text>
                <Text style={styles.emptyActivityBody}>{t("recentActivity.noneBody")}</Text>
              </View>
            ) : null}
          </View>
        </View>
      </ScrollView>
    </AppShell>
  );
};

const styles = StyleSheet.create({
  shell: {
    backgroundColor: COLORS.paper,
  },
  scrollContent: {
    gap: 22,
    paddingBottom: 32,
  },
  topBar: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  wordmark: {
    color: COLORS.ink,
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 3.2,
  },
  wordmarkRule: {
    backgroundColor: COLORS.terracotta,
    height: 2,
    marginTop: 7,
    width: 34,
  },
  profileCircle: {
    alignItems: "center",
    borderColor: COLORS.ink,
    borderRadius: 22,
    borderWidth: 1,
    height: 44,
    justifyContent: "center",
    width: 44,
  },
  profileInitial: {
    color: COLORS.ink,
    fontSize: 16,
    fontWeight: "700",
  },
  introBlock: {
    gap: 8,
    paddingTop: 4,
  },
  introEyebrow: {
    color: COLORS.sage,
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1.6,
    textTransform: "uppercase",
  },
  introTitle: {
    color: COLORS.ink,
    fontSize: 30,
    fontWeight: "800",
    lineHeight: 38,
  },
  introSubtitle: {
    color: COLORS.muted,
    fontSize: 14,
    lineHeight: 21,
  },
  continueCard: {
    backgroundColor: COLORS.ink,
    borderRadius: 26,
    gap: 12,
    padding: 20,
  },
  continueTopRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
  },
  terracottaMarker: {
    backgroundColor: COLORS.terracotta,
    borderRadius: 4,
    height: 14,
    width: 14,
  },
  continueEyebrow: {
    color: "#D8D5CA",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 2,
  },
  continueTitle: {
    color: COLORS.white,
    fontSize: 24,
    fontWeight: "700",
    lineHeight: 31,
  },
  continueMeta: {
    color: "#C8C8BF",
    fontSize: 14,
    lineHeight: 21,
  },
  continueFooter: {
    alignItems: "center",
    flexDirection: "row",
    gap: 16,
    marginTop: 3,
  },
  continueRule: {
    backgroundColor: COLORS.sage,
    borderRadius: 99,
    flex: 1,
    height: 4,
  },
  resumeButton: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
    paddingVertical: 6,
  },
  resumeLabel: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: "800",
  },
  resumeArrow: {
    color: COLORS.lime,
    fontSize: 23,
    lineHeight: 23,
  },
  sectionBlock: {
    gap: 12,
  },
  sectionHeader: {
    alignItems: "baseline",
    flexDirection: "row",
    gap: 10,
    justifyContent: "space-between",
  },
  sectionTitle: {
    color: COLORS.ink,
    flexShrink: 1,
    fontSize: 20,
    fontWeight: "800",
  },
  sectionDetail: {
    color: COLORS.sage,
    flexShrink: 1,
    fontSize: 11,
    fontWeight: "700",
    lineHeight: 17,
    textAlign: "right",
  },
  workspaceGrid: {
    flexDirection: "row",
    gap: 9,
  },
  workspaceCard: {
    borderRadius: 21,
    borderWidth: 1,
    flex: 1,
    gap: 10,
    minHeight: 172,
    padding: 13,
  },
  workspaceGlyph: {
    alignItems: "center",
    borderRadius: 22,
    borderWidth: 1.4,
    height: 42,
    justifyContent: "center",
    width: 42,
  },
  workspaceGlyphText: {
    fontSize: 22,
    fontWeight: "500",
  },
  workspaceTitle: {
    color: COLORS.ink,
    fontSize: 17,
    fontWeight: "800",
  },
  workspaceBody: {
    color: COLORS.muted,
    flex: 1,
    fontSize: 12,
    lineHeight: 17,
  },
  workspaceArrow: {
    alignSelf: "flex-end",
    fontSize: 23,
    lineHeight: 23,
  },
  focusList: {
    gap: 8,
  },
  focusChip: {
    alignItems: "center",
    backgroundColor: "#F8F5EE",
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: "row",
    gap: 10,
    minHeight: 46,
    paddingHorizontal: 13,
  },
  focusDot: {
    borderRadius: 99,
    height: 10,
    width: 10,
  },
  focusChipLabel: {
    color: COLORS.ink,
    flex: 1,
    fontSize: 14,
    fontWeight: "700",
  },
  focusChipArrow: {
    color: COLORS.muted,
    fontSize: 22,
    lineHeight: 22,
  },
  pulseCard: {
    backgroundColor: COLORS.white,
    borderColor: COLORS.line,
    borderRadius: 22,
    borderWidth: 1,
    flexDirection: "row",
    gap: 14,
    justifyContent: "space-between",
    padding: 17,
  },
  pulseCopy: {
    flex: 1,
    gap: 6,
  },
  pulseEyebrow: {
    color: COLORS.terracotta,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.3,
    textTransform: "uppercase",
  },
  pulseTitle: {
    color: COLORS.ink,
    fontSize: 17,
    fontWeight: "800",
  },
  pulseBody: {
    color: COLORS.muted,
    fontSize: 12,
    lineHeight: 17,
  },
  pulseStats: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
  },
  pulseStat: {
    alignItems: "center",
    minWidth: 52,
  },
  pulseStatValue: {
    color: COLORS.ink,
    fontSize: 25,
    fontWeight: "800",
  },
  pulseStatLabel: {
    color: COLORS.muted,
    fontSize: 10,
    fontWeight: "700",
    textAlign: "center",
  },
  pulseDivider: {
    backgroundColor: COLORS.line,
    height: 46,
    width: 1,
  },
  activityList: {
    backgroundColor: COLORS.white,
    borderColor: COLORS.line,
    borderRadius: 20,
    borderWidth: 1,
    overflow: "hidden",
  },
  activityRow: {
    alignItems: "center",
    borderBottomColor: COLORS.line,
    borderBottomWidth: 1,
    flexDirection: "row",
    gap: 11,
    minHeight: 72,
    paddingHorizontal: 14,
    paddingVertical: 11,
  },
  activityMarker: {
    backgroundColor: COLORS.sage,
    borderRadius: 99,
    height: 9,
    width: 9,
  },
  activityCopy: {
    flex: 1,
    gap: 4,
  },
  activityTitle: {
    color: COLORS.ink,
    fontSize: 14,
    fontWeight: "800",
  },
  activityBody: {
    color: COLORS.muted,
    fontSize: 12,
    lineHeight: 17,
  },
  activityStatus: {
    color: COLORS.sage,
    fontSize: 11,
    fontWeight: "800",
  },
  activityArrow: {
    color: COLORS.muted,
    fontSize: 22,
    lineHeight: 22,
  },
  emptyActivity: {
    gap: 6,
    padding: 16,
  },
  emptyActivityTitle: {
    color: COLORS.ink,
    fontSize: 14,
    fontWeight: "800",
  },
  emptyActivityBody: {
    color: COLORS.muted,
    fontSize: 12,
    lineHeight: 18,
  },
  pressed: {
    opacity: 0.76,
  },
  continuePressed: {
    opacity: 0.72,
  },
});
