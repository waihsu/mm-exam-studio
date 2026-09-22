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
  successBanner: { backgroundColor: "#E7EFE9", borderColor: "#A8C9BD", borderRadius: 14, borderWidth: 1, gap: 4, padding: 14 },
  successTitle: { color: "#48766B", fontSize: 15, fontWeight: "800" },
  successHint: { color: "#48766B", fontSize: 13, lineHeight: 19 },
  analyticsCard: { backgroundColor: "#FFFDF8", borderColor: "#D8D4C9", borderRadius: 12, borderWidth: 1, gap: 8, padding: 14 },
  analyticsTitle: { color: "#202321", fontSize: 14, fontWeight: "800" },
  analyticsRow: { alignItems: "center", flexDirection: "row", justifyContent: "space-between" },
  analyticsType: { color: "#4F514B", fontSize: 13 },
  analyticsValue: { color: "#202321", fontSize: 13, fontWeight: "700" },
});
