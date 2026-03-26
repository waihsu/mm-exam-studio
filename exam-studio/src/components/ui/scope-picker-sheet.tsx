import { SymbolView } from "expo-symbols";
import React from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { BottomSheet } from "./bottom-sheet";

type ScopePickerOption = {
  value: string;
  label: string;
};

type ScopePickerSheetProps = {
  visible: boolean;
  title: string;
  subtitle: string;
  options: ScopePickerOption[];
  selectedValue: string;
  clearLabel: string;
  doneLabel: string;
  onSelect: (value: string) => void;
  onClear: () => void;
  onClose: () => void;
};

export const ScopePickerSheet = ({
  visible,
  title,
  subtitle,
  options,
  selectedValue,
  clearLabel,
  doneLabel,
  onSelect,
  onClear,
  onClose,
}: ScopePickerSheetProps) => (
  <BottomSheet
    visible={visible}
    title={title}
    subtitle={subtitle}
    onClose={onClose}
    footer={
      <View style={styles.buttonRow}>
        <Pressable
          style={({ pressed }) => [styles.secondaryButton, pressed && styles.buttonPressed]}
          onPress={onClear}
        >
          <Text style={styles.secondaryButtonLabel}>{clearLabel}</Text>
        </Pressable>
        <Pressable
          style={({ pressed }) => [styles.primaryButton, pressed && styles.buttonPressed]}
          onPress={onClose}
        >
          <Text style={styles.primaryButtonLabel}>{doneLabel}</Text>
        </Pressable>
      </View>
    }
  >
    <ScrollView
      style={styles.sheetScroll}
      contentContainerStyle={styles.sheetScrollContent}
      showsVerticalScrollIndicator={false}
    >
      {options.map((option) => {
        const active = option.value === selectedValue;
        return (
          <Pressable
            key={`${title}-${option.value}`}
            style={({ pressed }) => [
              styles.optionRow,
              active && styles.optionRowActive,
              pressed && styles.buttonPressed,
            ]}
            onPress={() => onSelect(option.value)}
          >
            <Text style={[styles.optionLabel, active && styles.optionLabelActive]}>
              {option.label}
            </Text>
            {active ? (
              <SymbolView
                name={{ ios: "checkmark.circle.fill", android: "check_circle", web: "check_circle" }}
                size={18}
                tintColor="#2563EB"
              />
            ) : null}
          </Pressable>
        );
      })}
    </ScrollView>
  </BottomSheet>
);

const styles = StyleSheet.create({
  buttonRow: {
    flexDirection: "row",
    gap: 10,
  },
  primaryButton: {
    alignItems: "center",
    backgroundColor: "#2563EB",
    borderRadius: 12,
    flex: 1,
    justifyContent: "center",
    minHeight: 46,
    paddingHorizontal: 14,
  },
  primaryButtonLabel: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
  },
  secondaryButton: {
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderColor: "#CBD5E1",
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 46,
    paddingHorizontal: 14,
  },
  secondaryButtonLabel: {
    color: "#334155",
    fontSize: 14,
    fontWeight: "700",
  },
  buttonPressed: {
    opacity: 0.85,
  },
  sheetScroll: {
    maxHeight: 360,
  },
  sheetScrollContent: {
    gap: 10,
    paddingBottom: 6,
  },
  optionRow: {
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderColor: "#E2E8F0",
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  optionRowActive: {
    backgroundColor: "#EFF6FF",
    borderColor: "#93C5FD",
  },
  optionLabel: {
    color: "#0F172A",
    flex: 1,
    fontSize: 14,
    fontWeight: "600",
  },
  optionLabelActive: {
    color: "#1D4ED8",
  },
});
