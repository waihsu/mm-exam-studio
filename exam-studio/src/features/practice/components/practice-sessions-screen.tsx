import { useRouter, type RelativePathString } from "expo-router";
import React from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import { AppShell } from "@/features/app-shell/components/app-shell";
import { MiniHelpHint } from "@/components/ui/mini-help-hint";
import { useAppDateTimeFormatter } from "@/features/settings/hooks/use-app-date-time-formatter";
import { usePracticeSessionsQuery } from "../hooks/use-practice-sessions-query";

const formatScore = (value: number | null, unavailableLabel: string) => {
  if (typeof value !== "number") return unavailableLabel;
  return `${value.toFixed(1)}%`;
};

export const PracticeSessionsScreen = () => {
  const { t } = useTranslation("practice");
  const router = useRouter();
  const { formatDateTime } = useAppDateTimeFormatter();
  const sessionsQuery = usePracticeSessionsQuery();
  const goBackToPractice = () => {
    router.replace("/practice" as RelativePathString);
  };

  return (
    <AppShell>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.headerBlock}>
          <View style={styles.headerActionRow}>
            <Pressable
              accessibilityRole="button"
              style={({ pressed }) => [
                styles.backButton,
                pressed && styles.buttonPressed,
              ]}
              onPress={goBackToPractice}
            >
              <Text style={styles.backButtonLabel}>{t("sessions.back")}</Text>
            </Pressable>
          </View>
          <Text style={styles.heading}>{t("sessions.title")}</Text>
          <Text style={styles.subheading}>{t("sessions.subtitle")}</Text>
        </View>

        <View style={styles.card}>
          {sessionsQuery.isLoading ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator color="#2563EB" />
              <Text style={styles.metaText}>{t("sessions.loading")}</Text>
            </View>
          ) : null}

          {sessionsQuery.isError ? (
            <Text style={styles.errorText}>
              {sessionsQuery.error instanceof Error
                ? sessionsQuery.error.message
                : t("sessions.failed")}
            </Text>
          ) : null}

          {sessionsQuery.data?.rows.length === 0 ? (
            <View style={styles.emptyStateBlock}>
              <Text style={styles.metaText}>{t("sessions.empty")}</Text>
              <MiniHelpHint hint={t("sessions.emptyHint")} />
            </View>
          ) : null}

          {sessionsQuery.data?.rows.map((session) => (
            <Pressable
              key={session.id}
              style={({ pressed }) => [styles.sessionCard, pressed && styles.cardPressed]}
              onPress={() => router.push(`/practice/${session.id}` as RelativePathString)}
            >
              <View style={styles.sessionHeadingRow}>
                <Text style={styles.sessionTitle}>{session.title}</Text>
                <Text
                  style={[
                    styles.sessionStatus,
                    session.status === "completed" ? styles.sessionStatusDone : styles.sessionStatusLive,
                  ]}
                >
                  {session.status}
                </Text>
              </View>
              <Text style={styles.sessionMeta}>
                {t("sessions.scoreMeta", {
                  score: formatScore(session.scorePercent, "-"),
                  count: session.totalQuestions,
                })}
              </Text>
              <Text style={styles.sessionMeta}>
                {t("sessions.startedMeta", { date: formatDateTime(session.startedAt) })}
              </Text>
              {session.completedAt ? (
                <Text style={styles.sessionMeta}>
                  {t("sessions.completedMeta", { date: formatDateTime(session.completedAt) })}
                </Text>
              ) : null}
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </AppShell>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    gap: 16,
    paddingBottom: 20,
  },
  headerBlock: {
    gap: 4,
    marginTop: 8,
  },
  headerActionRow: {
    marginBottom: 4,
  },
  backButton: {
    alignItems: "center",
    alignSelf: "flex-start",
    borderColor: "#CBD5E1",
    borderRadius: 999,
    borderWidth: 1,
    minHeight: 36,
    justifyContent: "center",
    paddingHorizontal: 14,
  },
  backButtonLabel: {
    color: "#334155",
    fontSize: 13,
    fontWeight: "700",
  },
  heading: {
    color: "#111827",
    fontSize: 28,
    fontWeight: "800",
  },
  subheading: {
    color: "#4B5563",
    fontSize: 14,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderColor: "#D8DEE9",
    borderRadius: 14,
    borderWidth: 1,
    gap: 10,
    padding: 14,
  },
  loadingRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
  },
  metaText: {
    color: "#64748B",
    fontSize: 13,
  },
  errorText: {
    color: "#B91C1C",
    fontSize: 13,
    fontWeight: "600",
  },
  emptyStateBlock: {
    gap: 10,
  },
  sessionCard: {
    backgroundColor: "#F8FAFC",
    borderColor: "#D8DEE9",
    borderRadius: 10,
    borderWidth: 1,
    gap: 4,
    padding: 10,
  },
  cardPressed: {
    opacity: 0.85,
  },
  buttonPressed: {
    opacity: 0.85,
  },
  sessionHeadingRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  sessionTitle: {
    color: "#0F172A",
    fontSize: 14,
    fontWeight: "700",
    maxWidth: "75%",
  },
  sessionStatus: {
    borderRadius: 999,
    fontSize: 11,
    fontWeight: "700",
    overflow: "hidden",
    paddingHorizontal: 8,
    paddingVertical: 2,
    textTransform: "capitalize",
  },
  sessionStatusLive: {
    backgroundColor: "#E0EAFF",
    color: "#1D4ED8",
  },
  sessionStatusDone: {
    backgroundColor: "#DCFCE7",
    color: "#166534",
  },
  sessionMeta: {
    color: "#64748B",
    fontSize: 12,
  },
});
