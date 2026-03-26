import { SymbolView } from "expo-symbols";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

type ScopeSummaryGridItem = {
  key: string;
  label: string;
  value: string;
};

type ScopeSummaryGridProps = {
  items: ScopeSummaryGridItem[];
  onPress: (key: string) => void;
};

export const ScopeSummaryGrid = ({ items, onPress }: ScopeSummaryGridProps) => (
  <View style={styles.grid}>
    {items.map((item) => (
      <Pressable
        key={item.key}
        style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
        onPress={() => onPress(item.key)}
      >
        <Text style={styles.label}>{item.label}</Text>
        <View style={styles.valueRow}>
          <Text numberOfLines={1} style={styles.value}>
            {item.value}
          </Text>
          <SymbolView
            name={{ ios: "chevron.right", android: "chevron_right", web: "chevron_right" }}
            size={14}
            tintColor="#64748B"
          />
        </View>
      </Pressable>
    ))}
  </View>
);

const styles = StyleSheet.create({
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  card: {
    backgroundColor: "#F8FAFC",
    borderColor: "#D8E1F0",
    borderRadius: 16,
    borderWidth: 1,
    flexBasis: "47%",
    gap: 6,
    minHeight: 76,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  cardPressed: {
    opacity: 0.85,
  },
  label: {
    color: "#64748B",
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  valueRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
  },
  value: {
    color: "#0F172A",
    flex: 1,
    fontSize: 15,
    fontWeight: "600",
  },
});
