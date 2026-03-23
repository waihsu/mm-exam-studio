import React from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { AppShell } from "./app-shell";

type FullscreenLoadingProps = {
  label?: string;
};

export const FullscreenLoading = ({
  label = "Loading...",
}: FullscreenLoadingProps) => (
  <AppShell style={styles.container}>
    <View style={styles.content}>
      <ActivityIndicator size="large" color="#2563EB" />
      <Text style={styles.label}>{label}</Text>
    </View>
  </AppShell>
);

const styles = StyleSheet.create({
  container: {
    justifyContent: "center",
  },
  content: {
    alignItems: "center",
    gap: 12,
  },
  label: {
    color: "#475569",
    fontSize: 14,
    fontWeight: "600",
  },
});
