import React from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

export type QuestionMixBuilderItem = {
  key: string;
  label: string;
  helper?: string;
  value: string;
  availableCount?: number | null;
  onChange: (value: string) => void;
};

type QuestionMixBuilderProps = {
  title: string;
  hint: string;
  totalLabel: string;
  items: QuestionMixBuilderItem[];
};

const normalizeCountInput = (value: string) => value.replace(/[^0-9]/g, "");

export const QuestionMixBuilder = ({
  title,
  hint,
  totalLabel,
  items,
}: QuestionMixBuilderProps) => {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.hint}>{hint}</Text>
      </View>

      <View style={styles.rows}>
        {items.map((item) => {
          const numericValue = Number.parseInt(item.value || "0", 10) || 0;
          const maxAvailable =
            typeof item.availableCount === "number" && item.availableCount >= 0
              ? item.availableCount
              : null;

          return (
            <View key={item.key} style={styles.row}>
              <View style={styles.rowTextWrap}>
                <Text style={styles.rowLabel}>{item.label}</Text>
                <Text style={styles.rowMeta}>
                  {item.helper ?? ""}
                  {typeof maxAvailable === "number"
                    ? `${item.helper ? " • " : ""}${maxAvailable} available`
                    : ""}
                </Text>
              </View>

              <View style={styles.counterWrap}>
                <Pressable
                  style={({ pressed }) => [
                    styles.counterButton,
                    numericValue < 1 && styles.counterButtonDisabled,
                    pressed && numericValue > 0 && styles.buttonPressed,
                  ]}
                  disabled={numericValue < 1}
                  onPress={() => item.onChange(String(Math.max(0, numericValue - 1)))}
                >
                  <Text style={styles.counterButtonLabel}>-</Text>
                </Pressable>

                <TextInput
                  keyboardType="number-pad"
                  inputMode="numeric"
                  style={styles.input}
                  value={item.value}
                  onChangeText={(value) => {
                    const nextValue = normalizeCountInput(value);
                    if (typeof maxAvailable === "number" && Number.parseInt(nextValue || "0", 10) > maxAvailable) {
                      item.onChange(String(maxAvailable));
                      return;
                    }
                    item.onChange(nextValue);
                  }}
                  placeholder="0"
                  placeholderTextColor="#94A3B8"
                />

                <Pressable
                  style={({ pressed }) => [
                    styles.counterButton,
                    typeof maxAvailable === "number" && numericValue >= maxAvailable
                      ? styles.counterButtonDisabled
                      : null,
                    pressed &&
                    (typeof maxAvailable !== "number" || numericValue < maxAvailable)
                      ? styles.buttonPressed
                      : null,
                  ]}
                  disabled={typeof maxAvailable === "number" && numericValue >= maxAvailable}
                  onPress={() => item.onChange(String(numericValue + 1))}
                >
                  <Text style={styles.counterButtonLabel}>+</Text>
                </Pressable>
              </View>
            </View>
          );
        })}
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerLabel}>{totalLabel}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#F8FAFC",
    borderColor: "#D8DEE9",
    borderRadius: 14,
    borderWidth: 1,
    gap: 12,
    padding: 14,
  },
  header: {
    gap: 3,
  },
  title: {
    color: "#0F172A",
    fontSize: 15,
    fontWeight: "700",
  },
  hint: {
    color: "#64748B",
    fontSize: 12,
    lineHeight: 18,
  },
  rows: {
    gap: 10,
  },
  row: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-between",
  },
  rowTextWrap: {
    flex: 1,
    gap: 2,
  },
  rowLabel: {
    color: "#0F172A",
    fontSize: 14,
    fontWeight: "600",
  },
  rowMeta: {
    color: "#64748B",
    fontSize: 12,
  },
  counterWrap: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
  },
  counterButton: {
    alignItems: "center",
    backgroundColor: "#E2E8F0",
    borderRadius: 10,
    height: 34,
    justifyContent: "center",
    width: 34,
  },
  counterButtonDisabled: {
    opacity: 0.45,
  },
  counterButtonLabel: {
    color: "#0F172A",
    fontSize: 18,
    fontWeight: "700",
    lineHeight: 20,
  },
  input: {
    backgroundColor: "#FFFFFF",
    borderColor: "#CBD5E1",
    borderRadius: 10,
    borderWidth: 1,
    color: "#0F172A",
    fontSize: 14,
    fontWeight: "600",
    minWidth: 54,
    paddingHorizontal: 12,
    paddingVertical: 7,
    textAlign: "center",
  },
  footer: {
    borderTopColor: "#E2E8F0",
    borderTopWidth: 1,
    paddingTop: 10,
  },
  footerLabel: {
    color: "#0F172A",
    fontSize: 13,
    fontWeight: "700",
  },
  buttonPressed: {
    opacity: 0.78,
  },
});

