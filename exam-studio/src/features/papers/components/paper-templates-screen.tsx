import { useRouter, type RelativePathString } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { AppShell } from "@/features/app-shell/components/app-shell";
import {
  CardListSkeleton,
  EmptyStateCard,
  InlineErrorState,
} from "@/components/ui/state-blocks";
import { useRefreshAction } from "@/hooks/use-refresh-action";
import { useTranslation } from "@/i18n";
import { usePaperTemplatesQuery } from "../hooks/use-paper-templates-query";

type TemplateModeFilter = "all" | "custom" | "mcq_only" | "all_type";

const templateModeLabel = (mode: "custom" | "mcq_only" | "all_type") => {
  if (mode === "mcq_only") return "MCQ only";
  if (mode === "all_type") return "All type";
  return "Custom";
};

export const PaperTemplatesScreen = () => {
  const router = useRouter();
  const { t } = useTranslation(["papers", "common"]);
  const templatesQuery = usePaperTemplatesQuery();
  const [search, setSearch] = useState("");
  const [modeFilter, setModeFilter] = useState<TemplateModeFilter>("all");
  const [subjectFilter, setSubjectFilter] = useState<string>("all");

  const refresh = useRefreshAction(async () => {
    await templatesQuery.refetch();
  });
  const subjectOptions = useMemo(() => {
    const seen = new Map<string, string>();
    for (const row of templatesQuery.data?.rows ?? []) {
      if (!seen.has(row.subject.id)) {
        seen.set(row.subject.id, row.subject.name);
      }
    }
    return Array.from(seen.entries()).map(([value, label]) => ({ value, label }));
  }, [templatesQuery.data?.rows]);
  const filteredTemplates = useMemo(() => {
    const rows = templatesQuery.data?.rows ?? [];
    const normalizedSearch = search.trim().toLowerCase();

    return rows.filter((template) => {
      if (modeFilter !== "all" && template.mode !== modeFilter) {
        return false;
      }
      if (subjectFilter !== "all" && template.subject.id !== subjectFilter) {
        return false;
      }
      if (!normalizedSearch) {
        return true;
      }

      const haystack = [
        template.title,
        template.grade.name,
        template.subject.name,
        template.mode,
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(normalizedSearch);
    });
  }, [modeFilter, search, subjectFilter, templatesQuery.data?.rows]);

  return (
    <AppShell>
      <ScrollView
        alwaysBounceVertical
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refresh.refreshing}
            onRefresh={() => {
              void refresh.onRefresh();
            }}
          />
        }
      >
        <View style={styles.headerBlock}>
          <View style={styles.headerTopRow}>
            <Pressable
              style={({ pressed }) => [styles.backButton, pressed && styles.buttonPressed]}
              onPress={() => router.back()}
            >
              <Text style={styles.backButtonLabel}>{t("templates.backToPapers")}</Text>
            </Pressable>
            <View style={styles.planPill}>
              <Text style={styles.planPillLabel}>
                {t("templates.planShort", {
                  plan:
                    templatesQuery.data?.access.planCode?.toUpperCase() ??
                    t("templates.planFallback"),
                })}
              </Text>
            </View>
          </View>
          <Text style={styles.heading}>{t("templates.title")}</Text>
          <Text style={styles.subheading}>{t("templates.subtitleCompact")}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>{t("templates.catalogTitle")}</Text>

          <TextInput
            placeholder={t("templates.searchPlaceholder")}
            placeholderTextColor="#94A3B8"
            style={styles.searchInput}
            value={search}
            onChangeText={setSearch}
          />

          <View style={styles.filtersBlock}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filterRow}
            >
              {(
                [
                  ["all", t("common:filters.all")],
                  ["all_type", t("templates.modeAllType")],
                  ["mcq_only", t("templates.modeMcqOnly")],
                  ["custom", t("templates.modeCustom")],
                ] as const
              ).map(([value, label]) => {
                const active = modeFilter === value;
                return (
                  <Pressable
                    key={value}
                    style={({ pressed }) => [
                      styles.filterChip,
                      active && styles.filterChipActive,
                      pressed && styles.buttonPressed,
                    ]}
                    onPress={() => setModeFilter(value)}
                  >
                    <Text
                      style={[
                        styles.filterChipLabel,
                        active && styles.filterChipLabelActive,
                      ]}
                    >
                      {label}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filterRow}
            >
              <Pressable
                style={({ pressed }) => [
                  styles.filterChip,
                  subjectFilter === "all" && styles.filterChipActive,
                  pressed && styles.buttonPressed,
                ]}
                onPress={() => setSubjectFilter("all")}
              >
                <Text
                  style={[
                    styles.filterChipLabel,
                    subjectFilter === "all" && styles.filterChipLabelActive,
                  ]}
                >
                  {t("common:filters.all")}
                </Text>
              </Pressable>
              {subjectOptions.map((option) => {
                const active = subjectFilter === option.value;
                return (
                  <Pressable
                    key={option.value}
                    style={({ pressed }) => [
                      styles.filterChip,
                      active && styles.filterChipActive,
                      pressed && styles.buttonPressed,
                    ]}
                    onPress={() => setSubjectFilter(option.value)}
                  >
                    <Text
                      style={[
                        styles.filterChipLabel,
                        active && styles.filterChipLabelActive,
                      ]}
                    >
                      {option.label}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>

          {templatesQuery.isLoading ? <CardListSkeleton count={3} /> : null}

          {templatesQuery.isError ? (
            <InlineErrorState
              message={
                templatesQuery.error instanceof Error
                  ? templatesQuery.error.message
                  : t("home.failedTemplates")
              }
            />
          ) : null}

          {templatesQuery.data?.rows.length === 0 ? (
            <EmptyStateCard
              title={t("home.noTemplates")}
              hint={t("home.noTemplatesHint")}
              actionLabel={t("templates.backToBuilder")}
              onAction={() => router.replace("/papers" as RelativePathString)}
            />
          ) : null}

          {(templatesQuery.data?.rows.length ?? 0) > 0 && filteredTemplates.length === 0 ? (
            <EmptyStateCard
              title={t("templates.noMatches")}
              hint={t("templates.noMatchesHint")}
            />
          ) : null}

          {filteredTemplates.map((template) => (
            <Pressable
              key={template.id}
              style={({ pressed }) => [
                styles.templateCard,
                pressed && styles.buttonPressed,
              ]}
              onPress={() =>
                router.push(`/papers/templates/${template.id}` as RelativePathString)
              }
            >
              <View style={styles.templateHeadingRow}>
                <Text style={styles.templateTitle}>{template.title}</Text>
                <Text style={styles.statusPill}>{templateModeLabel(template.mode)}</Text>
              </View>
              <Text style={styles.templateMeta}>
                {template.grade.name} • {template.subject.name}
              </Text>
              <Text style={styles.templateMeta}>
                {t("templates.summaryLine", {
                  sections: template.sectionCount,
                  slots: template.slotCount,
                  marks: template.totalMarks,
                })}
              </Text>
              <View style={styles.templateFooterRow}>
                <Text style={styles.templateMeta}>
                  {template.includeAnswerPaper
                    ? t("templates.includesAnswerPaperShort")
                    : t("templates.questionOnlyShort")}
                </Text>
                <Text style={styles.viewDetailsLink}>{t("templates.viewDetails")}</Text>
              </View>
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
    gap: 8,
    marginTop: 8,
  },
  headerTopRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  backButton: {
    alignSelf: "flex-start",
    borderColor: "#CBD5E1",
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  backButtonLabel: {
    color: "#0F172A",
    fontSize: 13,
    fontWeight: "700",
  },
  heading: {
    color: "#111827",
    fontSize: 24,
    fontWeight: "800",
  },
  subheading: {
    color: "#4B5563",
    fontSize: 14,
    lineHeight: 20,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderColor: "#E2E8F0",
    borderRadius: 24,
    borderWidth: 1,
    gap: 14,
    padding: 18,
  },
  cardTitle: {
    color: "#111827",
    fontSize: 19,
    fontWeight: "700",
  },
  searchInput: {
    backgroundColor: "#F8FAFC",
    borderColor: "#CBD5E1",
    borderRadius: 14,
    borderWidth: 1,
    color: "#111827",
    fontSize: 15,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  metaText: {
    color: "#475569",
    fontSize: 14,
    lineHeight: 20,
  },
  metaMuted: {
    color: "#64748B",
    fontSize: 13,
    lineHeight: 20,
  },
  emptyStateBlock: {
    gap: 10,
    paddingVertical: 4,
  },
  filtersBlock: {
    gap: 8,
  },
  filterRow: {
    gap: 8,
  },
  filterChip: {
    backgroundColor: "#FFFFFF",
    borderColor: "#CBD5E1",
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  filterChipActive: {
    backgroundColor: "#EFF6FF",
    borderColor: "#60A5FA",
  },
  filterChipLabel: {
    color: "#334155",
    fontSize: 12,
    fontWeight: "700",
  },
  filterChipLabelActive: {
    color: "#1D4ED8",
  },
  templateCard: {
    backgroundColor: "#F8FAFC",
    borderColor: "#E2E8F0",
    borderRadius: 20,
    borderWidth: 1,
    gap: 6,
    padding: 14,
  },
  templateFooterRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 4,
  },
  templateHeadingRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
    justifyContent: "space-between",
  },
  templateTitle: {
    color: "#111827",
    flex: 1,
    fontSize: 15,
    fontWeight: "700",
  },
  templateMeta: {
    color: "#475569",
    fontSize: 12,
    lineHeight: 18,
  },
  statusPill: {
    backgroundColor: "#EFF6FF",
    borderColor: "#BFDBFE",
    borderRadius: 999,
    borderWidth: 1,
    color: "#1D4ED8",
    fontSize: 12,
    fontWeight: "700",
    overflow: "hidden",
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  primaryButton: {
    alignItems: "center",
    backgroundColor: "#2563EB",
    borderRadius: 16,
    justifyContent: "center",
    minHeight: 48,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  primaryButtonLabel: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
  secondaryButton: {
    alignItems: "center",
    borderColor: "#CBD5E1",
    borderRadius: 16,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 44,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  secondaryButtonLabel: {
    color: "#0F172A",
    fontSize: 14,
    fontWeight: "700",
  },
  buttonPressed: {
    opacity: 0.85,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  viewDetailsLink: {
    color: "#2563EB",
    fontSize: 13,
    fontWeight: "700",
  },
  planPill: {
    backgroundColor: "#EFF6FF",
    borderColor: "#BFDBFE",
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  planPillLabel: {
    color: "#1D4ED8",
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
  },
});
