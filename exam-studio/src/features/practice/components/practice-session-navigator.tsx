import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

export type PracticeNavigatorItem = {
  id: string;
  index: number;
  answered: boolean;
  active: boolean;
  correct: boolean;
  wrong: boolean;
};

type PracticeSessionNavigatorProps = {
  title: string;
  progressLabel: string;
  completed: boolean;
  currentLabel: string;
  answeredLabel: string;
  correctLabel: string;
  incorrectLabel: string;
  items: PracticeNavigatorItem[];
  onSelect: (index: number) => void;
};

export function PracticeSessionNavigator({
  title,
  progressLabel,
  completed,
  currentLabel,
  answeredLabel,
  correctLabel,
  incorrectLabel,
  items,
  onSelect,
}: PracticeSessionNavigatorProps) {
  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.meta}>{progressLabel}</Text>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
        {items.map((item) => (
          <Pressable
            key={`navigator-${item.id}`}
            style={({ pressed }) => [
              styles.chip,
              item.answered && !completed && styles.chipAnswered,
              item.correct && styles.chipCorrect,
              item.wrong && styles.chipWrong,
              item.active && styles.chipActive,
              pressed && styles.pressed,
            ]}
            onPress={() => onSelect(item.index)}
          >
            <Text style={[styles.chipLabel, item.active && styles.chipLabelActive]}>{item.index + 1}</Text>
          </Pressable>
        ))}
      </ScrollView>
      <View style={styles.legendRow}>
        <NavigatorLegend colorStyle={styles.legendCurrent} label={currentLabel} />
        {completed ? (
          <>
            <NavigatorLegend colorStyle={styles.legendCorrect} label={correctLabel} />
            <NavigatorLegend colorStyle={styles.legendWrong} label={incorrectLabel} />
          </>
        ) : (
          <NavigatorLegend colorStyle={styles.legendAnswered} label={answeredLabel} />
        )}
      </View>
    </View>
  );
}

function NavigatorLegend({
  colorStyle,
  label,
}: {
  colorStyle: object;
  label: string;
}) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.legendDot, colorStyle]} />
      <Text style={styles.legendLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: "#FFFFFF", borderColor: "#D8DEE9", borderRadius: 12, borderWidth: 1, gap: 10, padding: 14 },
  headerRow: { alignItems: "center", flexDirection: "row", justifyContent: "space-between" },
  title: { color: "#0F172A", fontSize: 14, fontWeight: "800" },
  meta: { color: "#64748B", fontSize: 12, fontWeight: "600" },
  chipRow: { gap: 8 },
  chip: { alignItems: "center", backgroundColor: "#F8FAFC", borderColor: "#D8DEE9", borderRadius: 10, borderWidth: 1, height: 38, justifyContent: "center", width: 38 },
  chipActive: { backgroundColor: "#1D4ED8", borderColor: "#1D4ED8" },
  chipAnswered: { backgroundColor: "#DBEAFE", borderColor: "#60A5FA" },
  chipCorrect: { backgroundColor: "#DCFCE7", borderColor: "#22C55E" },
  chipWrong: { backgroundColor: "#FEE2E2", borderColor: "#F87171" },
  chipLabel: { color: "#334155", fontSize: 13, fontWeight: "800" },
  chipLabelActive: { color: "#FFFFFF" },
  legendRow: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  legendItem: { alignItems: "center", flexDirection: "row", gap: 5 },
  legendDot: { borderRadius: 999, height: 8, width: 8 },
  legendCurrent: { backgroundColor: "#1D4ED8" },
  legendAnswered: { backgroundColor: "#60A5FA" },
  legendCorrect: { backgroundColor: "#22C55E" },
  legendWrong: { backgroundColor: "#F87171" },
  legendLabel: { color: "#64748B", fontSize: 11, fontWeight: "700" },
  pressed: { opacity: 0.84 },
});
