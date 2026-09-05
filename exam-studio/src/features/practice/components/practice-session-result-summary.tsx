import { StyleSheet, Text, View } from "react-native";

type PracticeResultTypeRow = {
  type: string;
  correct: number;
  total: number;
};

type PracticeSessionResultSummaryProps = {
  showSuccess: boolean;
  successTitle: string;
  successHint: string;
  analyticsTitle: string;
  typeRows: Array<PracticeResultTypeRow & { label: string }>;
};

export function PracticeSessionResultSummary({
  showSuccess,
  successTitle,
  successHint,
  analyticsTitle,
  typeRows,
}: PracticeSessionResultSummaryProps) {
  return (
    <>
      {showSuccess ? (
        <View style={styles.successBanner}>
          <Text style={styles.successTitle}>{successTitle}</Text>
          <Text style={styles.successHint}>{successHint}</Text>
        </View>
      ) : null}
      {typeRows.length ? (
        <View style={styles.analyticsCard}>
          <Text style={styles.analyticsTitle}>{analyticsTitle}</Text>
          {typeRows.map((row) => {
            const accuracy = row.total > 0 ? Math.round((row.correct / row.total) * 100) : 0;
            return (
              <View key={`analytics-${row.type}`} style={styles.analyticsRow}>
                <Text style={styles.analyticsType}>{row.label}</Text>
                <Text style={styles.analyticsValue}>{row.correct}/{row.total} ({accuracy}%)</Text>
              </View>
            );
          })}
        </View>
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  successBanner: { backgroundColor: "#ECFDF5", borderColor: "#86EFAC", borderRadius: 14, borderWidth: 1, gap: 4, padding: 14 },
  successTitle: { color: "#166534", fontSize: 15, fontWeight: "800" },
  successHint: { color: "#15803D", fontSize: 13, lineHeight: 19 },
  analyticsCard: { backgroundColor: "#FFFFFF", borderColor: "#D8DEE9", borderRadius: 12, borderWidth: 1, gap: 8, padding: 14 },
  analyticsTitle: { color: "#0F172A", fontSize: 14, fontWeight: "800" },
  analyticsRow: { alignItems: "center", flexDirection: "row", justifyContent: "space-between" },
  analyticsType: { color: "#334155", fontSize: 13 },
  analyticsValue: { color: "#0F172A", fontSize: 13, fontWeight: "700" },
});
