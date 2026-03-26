import React from "react";
import { ActivityIndicator, Image, StyleSheet, Text, View } from "react-native";
import { AppShell } from "./app-shell";

type FullscreenLoadingProps = {
  label?: string;
};

const BRAND_LOGO = require("../../../../assets/images/logo-glow.png");

export const FullscreenLoading = ({
  label = "Loading...",
}: FullscreenLoadingProps) => (
  <AppShell style={styles.container}>
    <View style={styles.content}>
      <View style={styles.glowPrimary} />
      <View style={styles.glowSecondary} />

      <View style={styles.card}>
        <View style={styles.logoWrap}>
          <Image source={BRAND_LOGO} style={styles.logo} resizeMode="contain" />
        </View>

        <View style={styles.copyBlock}>
          <Text style={styles.eyebrow}>MM EXAM STUDIO</Text>
          <Text style={styles.label}>{label}</Text>
          <Text style={styles.hint}>Preparing the next screen and keeping your session ready.</Text>
        </View>

        <View style={styles.progressCard}>
          <View style={styles.progressRow}>
            <ActivityIndicator color="#208AEF" />
            <Text style={styles.progressLabel}>Please wait a moment</Text>
          </View>
          <View style={styles.progressTrack}>
            <View style={styles.progressFill} />
          </View>
          <View style={styles.previewStack}>
            <View style={styles.previewCardLarge}>
              <View style={styles.previewLineStrong} />
              <View style={styles.previewLineSoft} />
              <View style={styles.previewLineSoftWide} />
            </View>
            <View style={styles.previewRow}>
              <View style={styles.previewCardSmall}>
                <View style={styles.previewPill} />
                <View style={styles.previewLineSoft} />
              </View>
              <View style={styles.previewCardSmall}>
                <View style={styles.previewPillMuted} />
                <View style={styles.previewLineSoftWide} />
              </View>
            </View>
          </View>
        </View>
      </View>
    </View>
  </AppShell>
);

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#EAF3FF",
    justifyContent: "center",
  },
  content: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: 520,
    overflow: "hidden",
    position: "relative",
  },
  glowPrimary: {
    backgroundColor: "rgba(32, 138, 239, 0.18)",
    borderRadius: 180,
    height: 280,
    position: "absolute",
    right: -40,
    top: 16,
    width: 280,
  },
  glowSecondary: {
    backgroundColor: "rgba(15, 23, 42, 0.08)",
    borderRadius: 150,
    bottom: 18,
    height: 220,
    left: -56,
    position: "absolute",
    width: 220,
  },
  card: {
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.94)",
    borderColor: "rgba(148, 163, 184, 0.24)",
    borderRadius: 30,
    borderWidth: 1,
    gap: 18,
    maxWidth: 440,
    paddingHorizontal: 22,
    paddingVertical: 24,
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.08,
    shadowRadius: 28,
    width: "100%",
  },
  logoWrap: {
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderColor: "rgba(32, 138, 239, 0.14)",
    borderRadius: 28,
    borderWidth: 1,
    height: 76,
    justifyContent: "center",
    width: 76,
  },
  logo: {
    height: 58,
    width: 58,
  },
  copyBlock: {
    alignItems: "center",
    gap: 8,
  },
  eyebrow: {
    color: "#208AEF",
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1.8,
  },
  hint: {
    color: "#64748B",
    fontSize: 13,
    lineHeight: 19,
    maxWidth: 280,
    textAlign: "center",
  },
  label: {
    color: "#0F172A",
    fontSize: 24,
    fontWeight: "900",
    lineHeight: 30,
    textAlign: "center",
  },
  progressCard: {
    alignSelf: "stretch",
    backgroundColor: "#F8FBFF",
    borderColor: "#D7E6F7",
    borderRadius: 24,
    borderWidth: 1,
    gap: 14,
    padding: 16,
  },
  progressRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
  },
  progressLabel: {
    color: "#334155",
    flex: 1,
    fontSize: 13,
    fontWeight: "700",
  },
  progressTrack: {
    backgroundColor: "#DCEAF8",
    borderRadius: 999,
    height: 8,
    overflow: "hidden",
  },
  progressFill: {
    backgroundColor: "#208AEF",
    borderRadius: 999,
    height: "100%",
    width: "62%",
  },
  previewStack: {
    gap: 10,
  },
  previewCardLarge: {
    backgroundColor: "#FFFFFF",
    borderColor: "#E2E8F0",
    borderRadius: 18,
    borderWidth: 1,
    gap: 8,
    padding: 14,
  },
  previewRow: {
    flexDirection: "row",
    gap: 10,
  },
  previewCardSmall: {
    backgroundColor: "#FFFFFF",
    borderColor: "#E2E8F0",
    borderRadius: 16,
    borderWidth: 1,
    flex: 1,
    gap: 8,
    padding: 12,
  },
  previewPill: {
    backgroundColor: "#DBEAFE",
    borderRadius: 999,
    height: 22,
    width: 74,
  },
  previewPillMuted: {
    backgroundColor: "#E2E8F0",
    borderRadius: 999,
    height: 22,
    width: 58,
  },
  previewLineStrong: {
    backgroundColor: "#CBDDF3",
    borderRadius: 999,
    height: 12,
    width: "58%",
  },
  previewLineSoft: {
    backgroundColor: "#E2E8F0",
    borderRadius: 999,
    height: 10,
    width: "76%",
  },
  previewLineSoftWide: {
    backgroundColor: "#E2E8F0",
    borderRadius: 999,
    height: 10,
    width: "92%",
  },
});
