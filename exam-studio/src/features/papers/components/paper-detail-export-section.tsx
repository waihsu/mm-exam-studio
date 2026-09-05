import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useTranslation } from "@/i18n";
import type { QuestionPaperDetail } from "../types/papers.types";

type PaperDetailExportSectionProps = {
  exportIsPending: boolean;
  exportStateHint: string;
  exportStateLabel: string;
  formatDateTime: (value?: string | null) => string;
  hasActionPending: boolean;
  paper: QuestionPaperDetail;
  onOpenPdf: () => void;
  onRequestExport: () => void;
};

export const PaperDetailExportSection = ({
  exportIsPending,
  exportStateHint,
  exportStateLabel,
  formatDateTime,
  hasActionPending,
  paper,
  onOpenPdf,
  onRequestExport,
}: PaperDetailExportSectionProps) => {
  const { t } = useTranslation(["papers", "common"]);
  const canExport = paper.status === "finalized" && !hasActionPending;
  const statusStyle = paper.exportedAt
    ? styles.statusPillReady
    : paper.status === "finalized"
      ? styles.statusPillPending
      : styles.statusPillDraft;

  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{t("papers:detail.export")}</Text>
      <View style={styles.statusCard}>
        <View style={styles.statusHeader}>
          <Text style={styles.statusTitle}>{exportStateLabel}</Text>
          <Text style={[styles.statusPill, statusStyle]}>
            {paper.exportedAt
              ? t("papers:status.pdfReady")
              : t(`papers:status.${paper.status}`)}
          </Text>
        </View>
        <Text style={styles.hint}>{exportStateHint}</Text>
        <Text style={styles.metaText}>
          {paper.includeAnswerKey
            ? t("papers:detail.answerKeyIncluded")
            : t("papers:detail.answerKeyHidden")}
        </Text>
        <Text style={styles.metaText}>
          {t("papers:detail.lastExport", {
            value: formatDateTime(paper.exportedAt),
          })}
        </Text>
      </View>

      <View style={styles.buttonColumn}>
        <Pressable
          disabled={!canExport}
          style={({ pressed }) => [
            styles.primaryButton,
            !canExport && styles.buttonDisabled,
            pressed && canExport && styles.buttonPressed,
          ]}
          onPress={onRequestExport}
        >
          {exportIsPending ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.primaryButtonLabel}>
              {paper.exportedAt
                ? t("papers:detail.regeneratePdfExport")
                : t("papers:detail.generatePdfExport")}
            </Text>
          )}
        </Pressable>

        {paper.exportedAt ? (
          <View style={styles.previewCard}>
            <Text style={styles.previewTitle}>
              {t("papers:detail.protectedPreviewTitle")}
            </Text>
            <Text style={styles.hint}>
              {t("papers:detail.protectedPreviewHint")}
            </Text>
            <Pressable
              disabled={hasActionPending}
              style={({ pressed }) => [
                styles.secondaryButton,
                hasActionPending && styles.buttonDisabled,
                pressed && !hasActionPending && styles.buttonPressed,
              ]}
              onPress={onOpenPdf}
            >
              <Text style={styles.secondaryButtonLabel}>
                {t("papers:detail.previewPdfInApp")}
              </Text>
            </Pressable>
          </View>
        ) : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#FFFFFF",
    borderColor: "#D8DEE9",
    borderRadius: 12,
    borderWidth: 1,
    gap: 10,
    padding: 14,
  },
  cardTitle: { color: "#0F172A", fontSize: 16, fontWeight: "700" },
  statusCard: {
    backgroundColor: "#F8FAFC",
    borderColor: "#E2E8F0",
    borderRadius: 12,
    borderWidth: 1,
    gap: 6,
    padding: 12,
  },
  statusHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
    justifyContent: "space-between",
  },
  statusTitle: { color: "#0F172A", flex: 1, fontSize: 14, fontWeight: "700" },
  statusPill: {
    borderRadius: 999,
    fontSize: 11,
    fontWeight: "800",
    overflow: "hidden",
    paddingHorizontal: 8,
    paddingVertical: 3,
    textTransform: "capitalize",
  },
  statusPillReady: { backgroundColor: "#DCFCE7", color: "#047857" },
  statusPillPending: { backgroundColor: "#DBEAFE", color: "#1D4ED8" },
  statusPillDraft: { backgroundColor: "#E2E8F0", color: "#475569" },
  hint: { color: "#64748B", fontSize: 12 },
  metaText: { color: "#475569", fontSize: 12 },
  buttonColumn: { gap: 8 },
  primaryButton: {
    alignItems: "center",
    backgroundColor: "#2563EB",
    borderRadius: 10,
    justifyContent: "center",
    minHeight: 42,
    paddingHorizontal: 10,
  },
  primaryButtonLabel: { color: "#FFFFFF", fontSize: 13, fontWeight: "700" },
  previewCard: {
    backgroundColor: "#F8FAFC",
    borderColor: "#E2E8F0",
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
    padding: 12,
  },
  previewTitle: { color: "#0F172A", fontSize: 14, fontWeight: "700" },
  secondaryButton: {
    alignItems: "center",
    borderColor: "#CBD5E1",
    borderRadius: 10,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 42,
    paddingHorizontal: 10,
  },
  secondaryButtonLabel: { color: "#334155", fontSize: 13, fontWeight: "700" },
  buttonDisabled: { opacity: 0.6 },
  buttonPressed: { opacity: 0.85 },
});
