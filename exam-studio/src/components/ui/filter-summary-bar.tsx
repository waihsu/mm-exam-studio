import React, { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

type FilterSummaryItem = {
  key: string;
  label: string;
};

type FilterSummaryBarProps = {
  items: FilterSummaryItem[];
  emptyText: string;
  onRemove: (key: string) => void;
};

export const FilterSummaryBar = ({ items, emptyText, onRemove }: FilterSummaryBarProps) => {
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (items.length <= 2) {
      setExpanded(false);
    }
  }, [items.length]);

  if (items.length === 0) {
    return <Text style={styles.emptyText}>{emptyText}</Text>;
  }

  const canExpand = items.length > 2;

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>Active Filters</Text>
          <View style={styles.countBadge}>
            <Text style={styles.countBadgeLabel}>{items.length}</Text>
          </View>
        </View>

        {canExpand ? (
          <Pressable
            style={({ pressed }) => [styles.toggleButton, pressed && styles.pressed]}
            onPress={() => setExpanded((current) => !current)}
          >
            <Text style={styles.toggleButtonLabel}>{expanded ? "Collapse" : "Expand"}</Text>
          </Pressable>
        ) : null}
      </View>

      {expanded ? (
        <View style={styles.wrapList}>
          {items.map((item) => (
            <Pressable
              key={item.key}
              style={({ pressed }) => [styles.filterPill, pressed && styles.pressed]}
              onPress={() => onRemove(item.key)}
            >
              <Text style={styles.filterPillLabel}>{item.label}</Text>
              <Text style={styles.filterPillClose}>x</Text>
            </Pressable>
          ))}
        </View>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {items.map((item) => (
            <Pressable
              key={item.key}
              style={({ pressed }) => [styles.filterPill, pressed && styles.pressed]}
              onPress={() => onRemove(item.key)}
            >
              <Text numberOfLines={1} style={styles.filterPillLabel}>
                {item.label}
              </Text>
              <Text style={styles.filterPillClose}>x</Text>
            </Pressable>
          ))}
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#F8FAFC",
    borderColor: "#E2E8F0",
    borderRadius: 12,
    borderWidth: 1,
    gap: 10,
    padding: 12,
  },
  headerRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  titleRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
  },
  title: {
    color: "#0F172A",
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.3,
    textTransform: "uppercase",
  },
  countBadge: {
    alignItems: "center",
    backgroundColor: "#DBEAFE",
    borderRadius: 999,
    justifyContent: "center",
    minWidth: 24,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  countBadgeLabel: {
    color: "#1D4ED8",
    fontSize: 12,
    fontWeight: "800",
  },
  toggleButton: {
    borderColor: "#CBD5E1",
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  toggleButtonLabel: {
    color: "#334155",
    fontSize: 12,
    fontWeight: "700",
  },
  scrollContent: {
    gap: 8,
    paddingRight: 8,
  },
  wrapList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  filterPill: {
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: "#FFFFFF",
    borderColor: "#BFDBFE",
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: "row",
    gap: 6,
    maxWidth: 220,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  filterPillLabel: {
    color: "#1D4ED8",
    fontSize: 12,
    fontWeight: "600",
  },
  filterPillClose: {
    color: "#2563EB",
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  emptyText: {
    color: "#64748B",
    fontSize: 13,
  },
  pressed: {
    opacity: 0.85,
  },
});
