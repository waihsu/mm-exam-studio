import { Pressable, StyleSheet, Text, View } from "react-native";
import { InlineErrorState } from "@/components/ui/state-blocks";
import { useTranslation } from "@/i18n";
import type { QuestionPaperDetail } from "../types/papers.types";

type PaperDetailHeaderProps = {
  actionMessage: string | null;
  canBackToDraft: boolean;
  formatDateTime: (value?: string | null) => string;
  hasActionPending: boolean;
  isDraft: boolean;
  metadataDirty: boolean;
  paper: QuestionPaperDetail;
  title: string;
  onBack: () => void;
  onFinalizeOrReopen: () => void;
  onSaveDraft: () => void;
};

export const PaperDetailHeader = ({
  actionMessage,
  canBackToDraft,
  formatDateTime,
  hasActionPending,
  isDraft,
  metadataDirty,
  paper,
  title,
  onBack,
  onFinalizeOrReopen,
  onSaveDraft,
}: PaperDetailHeaderProps) => {
  const { t } = useTranslation(["papers", "common"]);
  const statusLabel = paper.exportedAt
    ? t("papers:status.pdfReady")
    : t(`papers:status.${paper.status}`);
  const statusStyle = paper.exportedAt
    ? styles.statusPillReady
    : paper.status === "finalized"
      ? styles.statusPillPending
      : styles.statusPillDraft;
  const saveDisabled = hasActionPending || !metadataDirty || !title.trim();
  const statusActionDisabled =
    hasActionPending || metadataDirty || (!isDraft && !canBackToDraft);

  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        <Pressable
          style={({ pressed }) => [
            styles.secondaryButton,
            styles.backButton,
            pressed && styles.buttonPressed,
          ]}
          onPress={onBack}
        >
          <Text style={styles.secondaryButtonLabel}>
            {t("papers:detail.back")}
          </Text>
        </Pressable>
        <Text style={[styles.statusPill, statusStyle]}>{statusLabel}</Text>
      </View>

      <Text style={styles.heading}>{title.trim() || paper.title}</Text>
      <Text style={styles.metaText}>
        {t("papers:detail.statusLine", {
          status: paper.exportedAt ? t("papers:status.exported") : statusLabel,
          questions: paper.totalQuestions,
          marks: paper.totalMarks,
        })}
      </Text>

      <View style={styles.metricsRow}>
        <Metric
          label={t("papers:detail.questions")}
          value={paper.totalQuestions}
        />
        <Metric label={t("papers:home.totalMarks")} value={paper.totalMarks} />
        <Metric
          label={t("papers:detail.updated", { value: "" }).split(":")[0]}
          value={formatDateTime(paper.updatedAt)}
          wide
        />
      </View>

      {paper.exportedAt ? (
        <Text style={styles.metaText}>
          {t("papers:detail.exported", {
            value: formatDateTime(paper.exportedAt),
          })}
        </Text>
      ) : null}

      <View style={styles.actionRow}>
        {isDraft ? (
          <Pressable
            disabled={saveDisabled}
            style={({ pressed }) => [
              styles.secondaryButton,
              styles.actionButton,
              saveDisabled && styles.buttonDisabled,
              pressed && !saveDisabled && styles.buttonPressed,
            ]}
            onPress={onSaveDraft}
          >
            <Text style={styles.secondaryButtonLabel}>
              {t("papers:detail.saveDraft")}
            </Text>
          </Pressable>
        ) : null}

        <Pressable
          disabled={statusActionDisabled}
          style={({ pressed }) => [
            styles.secondaryButton,
            styles.actionButton,
            statusActionDisabled && styles.buttonDisabled,
            pressed && !statusActionDisabled && styles.buttonPressed,
          ]}
          onPress={onFinalizeOrReopen}
        >
          <Text style={styles.secondaryButtonLabel}>
            {isDraft
              ? t("papers:detail.finalize")
              : t("papers:detail.backToDraft")}
          </Text>
        </Pressable>
      </View>

      {isDraft && metadataDirty ? (
        <Text style={styles.saveBeforeFinalizeHint}>
          {t("papers:detail.saveBeforeFinalize")}
        </Text>
      ) : null}

      {actionMessage ? (
        actionMessage.toLowerCase().includes("failed") ? (
          <InlineErrorState message={actionMessage} />
        ) : (
          <Text style={styles.actionMessage}>{actionMessage}</Text>
        )
      ) : null}
    </View>
  );
};

const Metric = ({
  label,
  value,
  wide = false,
}: {
  label: string;
  value: string | number;
  wide?: boolean;
}) => (
  <View style={wide ? styles.metricCardWide : styles.metricCard}>
    <Text style={styles.metricLabel}>{label}</Text>
    <Text style={wide ? styles.metricValueSmall : styles.metricValue}>
      {value}
    </Text>
  </View>
);

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#FFFDF8",
    borderColor: "#D8D4C9",
    borderRadius: 12,
    borderWidth: 1,
    gap: 6,
    padding: 14,
  },
  topRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  heading: { color: "#202321", fontSize: 24, fontWeight: "800" },
  metaText: { color: "#6E706B", fontSize: 12 },
  metricsRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 4 },
  metricCard: {
    backgroundColor: "#F8F5EE",
    borderColor: "#D8D4C9",
    borderRadius: 12,
    borderWidth: 1,
    flex: 1,
    minWidth: 96,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  metricCardWide: {
    backgroundColor: "#F8F5EE",
    borderColor: "#D8D4C9",
    borderRadius: 12,
    borderWidth: 1,
    flex: 1.4,
    minWidth: 150,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  metricLabel: {
    color: "#6E706B",
    fontSize: 11,
    fontWeight: "700",
    marginBottom: 4,
    textTransform: "uppercase",
  },
  metricValue: { color: "#202321", fontSize: 18, fontWeight: "800" },
  metricValueSmall: {
    color: "#202321",
    fontSize: 12,
    fontWeight: "700",
    lineHeight: 16,
  },
  statusPill: {
    borderRadius: 999,
    fontSize: 11,
    fontWeight: "800",
    overflow: "hidden",
    paddingHorizontal: 8,
    paddingVertical: 3,
    textTransform: "capitalize",
  },
  statusPillReady: { backgroundColor: "#E7EFE9", color: "#48766B" },
  statusPillPending: { backgroundColor: "#F5E4DA", color: "#D76F55" },
  statusPillDraft: { backgroundColor: "#D8D4C9", color: "#6E706B" },
  actionRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 8 },
  actionButton: { flexGrow: 1, minWidth: 100 },
  secondaryButton: {
    alignItems: "center",
    backgroundColor: "#FFFDF8",
    borderColor: "#CFC9BD",
    borderRadius: 10,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 42,
    paddingHorizontal: 14,
  },
  secondaryButtonLabel: { color: "#48766B", fontSize: 13, fontWeight: "700" },
  backButton: { minHeight: 38, paddingHorizontal: 12 },
  buttonDisabled: { opacity: 0.5 },
  buttonPressed: { opacity: 0.78 },
  actionMessage: { color: "#48766B", fontSize: 12, fontWeight: "600" },
  saveBeforeFinalizeHint: { color: "#AD5948", fontSize: 12, lineHeight: 18 },
});
