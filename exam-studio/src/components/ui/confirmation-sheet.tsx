import React from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { BottomSheet } from "./bottom-sheet";

type ConfirmationSheetProps = {
  visible: boolean;
  title: string;
  message: string;
  onClose: () => void;
  onConfirm: () => void;
  confirmLabel?: string;
  cancelLabel?: string | null;
  confirmTone?: "primary" | "danger";
  isPending?: boolean;
  hint?: string;
};

export const ConfirmationSheet = ({
  visible,
  title,
  message,
  onClose,
  onConfirm,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  confirmTone = "primary",
  isPending = false,
  hint,
}: ConfirmationSheetProps) => {
  return (
    <BottomSheet
      visible={visible}
      title={title}
      onClose={onClose}
      footer={
        <View style={styles.buttonRow}>
          {cancelLabel ? (
            <Pressable
              style={({ pressed }) => [styles.secondaryButton, pressed && styles.buttonPressed]}
              onPress={onClose}
            >
              <Text style={styles.secondaryButtonLabel}>{cancelLabel}</Text>
            </Pressable>
          ) : null}
          <Pressable
            disabled={isPending}
            style={({ pressed }) => [
              styles.confirmButton,
              confirmTone === "danger" && styles.dangerButton,
              isPending && styles.buttonDisabled,
              pressed && !isPending && styles.buttonPressed,
            ]}
            onPress={onConfirm}
          >
            {isPending ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.confirmButtonLabel}>{confirmLabel}</Text>
            )}
          </Pressable>
        </View>
      }
    >
      <View style={styles.body}>
        <Text style={styles.message}>{message}</Text>
        {hint ? <Text style={styles.hint}>{hint}</Text> : null}
      </View>
    </BottomSheet>
  );
};

const styles = StyleSheet.create({
  body: {
    gap: 10,
    paddingBottom: 8,
  },
  message: {
    color: "#0F172A",
    fontSize: 14,
    lineHeight: 21,
  },
  hint: {
    color: "#64748B",
    fontSize: 13,
    lineHeight: 19,
  },
  buttonRow: {
    flexDirection: "row",
    gap: 10,
  },
  secondaryButton: {
    alignItems: "center",
    borderColor: "#CBD5E1",
    borderRadius: 10,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 44,
    minWidth: 96,
    paddingHorizontal: 12,
  },
  secondaryButtonLabel: {
    color: "#334155",
    fontSize: 14,
    fontWeight: "700",
  },
  confirmButton: {
    alignItems: "center",
    backgroundColor: "#2563EB",
    borderRadius: 10,
    flex: 1,
    justifyContent: "center",
    minHeight: 44,
    paddingHorizontal: 12,
  },
  dangerButton: {
    backgroundColor: "#DC2626",
  },
  confirmButtonLabel: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonPressed: {
    opacity: 0.9,
  },
});
