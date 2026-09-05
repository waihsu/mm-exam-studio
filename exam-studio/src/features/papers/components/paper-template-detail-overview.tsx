import { StyleSheet, Text, View } from "react-native";
import { useTranslation } from "@/i18n";
import type {
  PaperQuestionType,
  PaperTemplateDetail,
  PaperTemplateSection,
  PaperTemplateSlot,
} from "../types/papers.types";

type PaperTemplateDetailOverviewProps = {
  scopeSummary: string | null;
  template: PaperTemplateDetail;
};

export const PaperTemplateDetailOverview = ({
  scopeSummary,
  template,
}: PaperTemplateDetailOverviewProps) => {
  const { t } = useTranslation(["papers", "common"]);

  return (
    <>
      <View style={styles.card}>
        <View style={styles.templateHeadingRow}>
          <Text style={styles.templateTitle}>{template.title}</Text>
          <Text style={styles.statusPill}>
            {getTemplateModeLabel(template.mode)}
          </Text>
        </View>
        <Text style={styles.templateMeta}>
          {template.grade.name} • {template.subject.name}
        </Text>
        <View style={styles.metricRow}>
          <Metric
            label={t("papers:templates.metrics.sections")}
            value={template.sectionCount}
          />
          <Metric
            label={t("papers:templates.metrics.slots")}
            value={template.slotCount}
          />
          <Metric
            label={t("papers:templates.metrics.marks")}
            value={template.totalMarks}
          />
        </View>
        <Text style={styles.metaMuted}>
          {template.includeAnswerPaper
            ? t("papers:templates.includesAnswerPaperShort")
            : t("papers:templates.questionOnlyShort")}
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>{t("papers:templates.scopeTitle")}</Text>
        <Text style={styles.metaText}>{scopeSummary}</Text>
        <View style={styles.difficultyGrid}>
          <DifficultyMetric
            label={t("papers:templates.difficulty.easy")}
            value={template.difficultyDistribution.easy}
          />
          <DifficultyMetric
            label={t("papers:templates.difficulty.normal")}
            value={template.difficultyDistribution.normal}
          />
          <DifficultyMetric
            label={t("papers:templates.difficulty.hard")}
            value={template.difficultyDistribution.hard}
          />
          <DifficultyMetric
            label={t("papers:templates.difficulty.advance")}
            value={template.difficultyDistribution.advance}
          />
        </View>
      </View>

      {template.sections.length > 0 ? (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>
            {t("papers:templates.sectionsTitle")}
          </Text>
          <View style={styles.listBlock}>
            {template.sections.map(section => (
              <View key={section.id} style={styles.listRow}>
                <View style={styles.listBadge}>
                  <Text style={styles.listBadgeLabel}>{section.code}</Text>
                </View>
                <View style={styles.listBody}>
                  <Text style={styles.listTitle}>
                    {section.title || t("papers:templates.sectionFallback")}
                  </Text>
                  <Text style={styles.listMeta}>
                    {formatSectionLine(section, t)}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      ) : null}

      {template.mode === "custom" && template.slots.length > 0 ? (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>
            {t("papers:templates.slotsTitle")}
          </Text>
          <View style={styles.listBlock}>
            {template.slots.map(slot => (
              <View key={slot.id} style={styles.slotRow}>
                <Text style={styles.slotText}>{formatSlotLine(slot, t)}</Text>
              </View>
            ))}
          </View>
        </View>
      ) : null}
    </>
  );
};

const Metric = ({ label, value }: { label: string; value: number }) => (
  <View style={styles.metricChip}>
    <Text style={styles.metricLabel}>{label}</Text>
    <Text style={styles.metricValue}>{value}</Text>
  </View>
);

const DifficultyMetric = ({
  label,
  value,
}: {
  label: string;
  value: number;
}) => (
  <View style={styles.difficultyChip}>
    <Text style={styles.difficultyLabel}>{label}</Text>
    <Text style={styles.difficultyValue}>{value}%</Text>
  </View>
);

const getTemplateModeLabel = (mode: "custom" | "mcq_only" | "all_type") => {
  if (mode === "mcq_only") return "MCQ only";
  if (mode === "all_type") return "All type";
  return "Custom";
};

const getQuestionTypeLabel = (
  value: PaperQuestionType | null | undefined,
  t: (key: string) => string
) => {
  if (!value) return t("papers:questionTypes.all");
  if (value === "mcq") return t("papers:questionTypes.mcq");
  if (value === "true_false") return t("papers:questionTypes.trueFalse");
  if (value === "short_answer") return t("papers:questionTypes.shortAnswer");
  if (value === "long_answer") return t("papers:questionTypes.longAnswer");
  if (value === "fill_blank") return t("papers:questionTypes.fillBlank");
  return t("papers:questionTypes.matching");
};

const formatSectionLine = (
  section: PaperTemplateSection,
  t: (key: string, params?: Record<string, unknown>) => string
) =>
  t("papers:templates.sectionSummary", {
    count: section.questionCount,
    type: getQuestionTypeLabel(section.questionType, t),
    marks: section.totalMarks,
  });

const formatSlotLine = (
  slot: PaperTemplateSlot,
  t: (key: string, params?: Record<string, unknown>) => string
) => {
  const difficulty = slot.difficultyTarget
    ? t(`papers:templates.difficulty.${slot.difficultyTarget}`)
    : t("papers:templates.difficulty.any");
  const scope =
    slot.subChapter?.name ??
    slot.chapter?.name ??
    t("papers:templates.scopeAny");

  return t("papers:templates.slotSummary", {
    slot: slot.slotNumber,
    type: getQuestionTypeLabel(slot.questionType, t),
    marks: slot.marks,
    difficulty,
    scope,
  });
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#FFFFFF",
    borderColor: "#E2E8F0",
    borderRadius: 20,
    borderWidth: 1,
    gap: 12,
    padding: 16,
  },
  cardTitle: { color: "#0F172A", fontSize: 16, fontWeight: "800" },
  templateHeadingRow: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 10,
    justifyContent: "space-between",
  },
  templateTitle: { color: "#0F172A", flex: 1, fontSize: 19, fontWeight: "800" },
  statusPill: {
    backgroundColor: "#E0E7FF",
    borderRadius: 999,
    color: "#3730A3",
    fontSize: 11,
    fontWeight: "800",
    overflow: "hidden",
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  templateMeta: { color: "#475569", fontSize: 13, fontWeight: "600" },
  metaText: { color: "#475569", fontSize: 13 },
  metaMuted: { color: "#64748B", fontSize: 12 },
  metricRow: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  metricChip: {
    backgroundColor: "#F8FAFC",
    borderColor: "#E2E8F0",
    borderRadius: 14,
    borderWidth: 1,
    flex: 1,
    minWidth: 88,
    paddingHorizontal: 10,
    paddingVertical: 9,
  },
  metricLabel: {
    color: "#64748B",
    fontSize: 10,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  metricValue: {
    color: "#0F172A",
    fontSize: 18,
    fontWeight: "800",
    marginTop: 3,
  },
  difficultyGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  difficultyChip: {
    backgroundColor: "#F8FAFC",
    borderColor: "#E2E8F0",
    borderRadius: 14,
    borderWidth: 1,
    flex: 1,
    minWidth: 130,
    paddingHorizontal: 11,
    paddingVertical: 10,
  },
  difficultyLabel: { color: "#64748B", fontSize: 11, fontWeight: "700" },
  difficultyValue: {
    color: "#1E3A8A",
    fontSize: 17,
    fontWeight: "800",
    marginTop: 3,
  },
  listBlock: { gap: 10 },
  listRow: { alignItems: "flex-start", flexDirection: "row", gap: 12 },
  listBadge: {
    alignItems: "center",
    backgroundColor: "#DBEAFE",
    borderRadius: 10,
    height: 36,
    justifyContent: "center",
    width: 36,
  },
  listBadgeLabel: { color: "#1D4ED8", fontSize: 11, fontWeight: "800" },
  listBody: { flex: 1, gap: 2 },
  listTitle: { color: "#0F172A", fontSize: 14, fontWeight: "700" },
  listMeta: { color: "#64748B", fontSize: 12, lineHeight: 17 },
  slotRow: {
    backgroundColor: "#F8FAFC",
    borderColor: "#E2E8F0",
    borderRadius: 12,
    borderWidth: 1,
    padding: 11,
  },
  slotText: { color: "#334155", fontSize: 13, lineHeight: 18 },
});
