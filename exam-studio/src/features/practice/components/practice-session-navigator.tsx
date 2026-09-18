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
  card: { backgroundColor: "#FFFDF8", borderColor: "#D8D4C9", borderRadius: 12, borderWidth: 1, gap: 10, padding: 14 },
  headerRow: { alignItems: "center", flexDirection: "row", justifyContent: "space-between" },
  title: { color: "#202321", fontSize: 14, fontWeight: "800" },
  meta: { color: "#6E706B", fontSize: 12, fontWeight: "600" },
  chipRow: { gap: 8 },
  chip: { alignItems: "center", backgroundColor: "#F8F5EE", borderColor: "#D8D4C9", borderRadius: 10, borderWidth: 1, height: 38, justifyContent: "center", width: 38 },
  chipActive: { backgroundColor: "#D76F55", borderColor: "#D76F55" },
  chipAnswered: { backgroundColor: "#F5E4DA", borderColor: "#E09A82" },
  chipCorrect: { backgroundColor: "#E7EFE9", borderColor: "#7FA99D" },
  chipWrong: { backgroundColor: "#F5E4DA", borderColor: "#D76F55" },
  chipLabel: { color: "#4F514B", fontSize: 13, fontWeight: "800" },
  chipLabelActive: { color: "#FFFDF8" },
  legendRow: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  legendItem: { alignItems: "center", flexDirection: "row", gap: 5 },
  legendDot: { borderRadius: 999, height: 8, width: 8 },
  legendCurrent: { backgroundColor: "#D76F55" },
  legendAnswered: { backgroundColor: "#E09A82" },
  legendCorrect: { backgroundColor: "#7FA99D" },
  legendWrong: { backgroundColor: "#D76F55" },
  legendLabel: { color: "#6E706B", fontSize: 11, fontWeight: "700" },
  pressed: { opacity: 0.84 },
});
