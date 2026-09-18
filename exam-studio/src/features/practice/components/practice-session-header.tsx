import { Pressable, StyleSheet, Text, View } from "react-native";

type PracticeSessionHeaderProps = {
  title: string;
  backLabel: string;
  metaLine: string;
  progressLabel: string;
  answeredLabel: string;
  unansweredLabel: string;
  completedDetail?: string;
  onBack: () => void;
};

export function PracticeSessionHeader({
  title,
  backLabel,
  metaLine,
  progressLabel,
  answeredLabel,
  unansweredLabel,
  completedDetail,
  onBack,
}: PracticeSessionHeaderProps) {
  return (
    <View style={styles.card}>
      <Pressable style={({ pressed }) => [styles.backLink, pressed && styles.pressed]} onPress={onBack}>
        <Text style={styles.backLinkLabel}>{backLabel}</Text>
      </Pressable>
      <Text style={styles.heading}>{title}</Text>
      <Text style={styles.metaLine}>{metaLine}</Text>
      <View style={styles.statsRow}>
        {[progressLabel, answeredLabel, unansweredLabel].map((label) => (
          <View key={label} style={styles.statPill}>
            <Text style={styles.statLabel}>{label}</Text>
          </View>
        ))}
      </View>
      {completedDetail ? <Text style={styles.completedDetail}>{completedDetail}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#FFFDF8",
    borderColor: "#D8D4C9",
    borderRadius: 16,
    borderWidth: 1,
    gap: 10,
    padding: 14,
  },
  backLink: { alignSelf: "flex-start" },
  backLinkLabel: { color: "#D76F55", fontSize: 13, fontWeight: "700" },
  heading: { color: "#202321", fontSize: 26, fontWeight: "800" },
  metaLine: { color: "#6E706B", fontSize: 12 },
  statsRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  statPill: {
    backgroundColor: "#F8F5EE",
    borderColor: "#D8D4C9",
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  statLabel: { color: "#4F514B", fontSize: 12, fontWeight: "700" },
  completedDetail: { color: "#6E706B", fontSize: 12 },
  pressed: { opacity: 0.86 },
});
