import { Pressable, StyleSheet, Text, View } from "react-native";

type PracticeSessionPaginationProps = {
  previousLabel: string;
  nextLabel: string;
  progressLabel: string;
  previousDisabled: boolean;
  nextDisabled: boolean;
  onPrevious: () => void;
  onNext: () => void;
};

export function PracticeSessionPagination({
  previousLabel,
  nextLabel,
  progressLabel,
  previousDisabled,
  nextDisabled,
  onPrevious,
  onNext,
}: PracticeSessionPaginationProps) {
  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <Pressable
          disabled={previousDisabled}
          style={({ pressed }) => [styles.button, previousDisabled && styles.disabled, pressed && !previousDisabled && styles.pressed]}
          onPress={onPrevious}
        >
          <Text style={styles.buttonLabel}>{previousLabel}</Text>
        </Pressable>
        <Text style={styles.progress}>{progressLabel}</Text>
        <Pressable
          disabled={nextDisabled}
          style={({ pressed }) => [styles.button, nextDisabled && styles.disabled, pressed && !nextDisabled && styles.pressed]}
          onPress={onNext}
        >
          <Text style={styles.buttonLabel}>{nextLabel}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: "#FFFDF8", borderColor: "#D8D4C9", borderRadius: 12, borderWidth: 1, padding: 12 },
  row: { alignItems: "center", flexDirection: "row", gap: 10, justifyContent: "space-between" },
  button: { alignItems: "center", backgroundColor: "#FFFDF8", borderColor: "#CFC9BD", borderRadius: 10, borderWidth: 1, minWidth: 82, paddingHorizontal: 12, paddingVertical: 10 },
  buttonLabel: { color: "#4F514B", fontSize: 13, fontWeight: "700" },
  progress: { color: "#6E706B", flex: 1, fontSize: 12, fontWeight: "700", textAlign: "center" },
  disabled: { opacity: 0.45 },
  pressed: { opacity: 0.84 },
});
