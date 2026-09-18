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
            <ActivityIndicator color="#48766B" />
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
    backgroundColor: "#F3EFE6",
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
    backgroundColor: "rgba(72, 118, 107, 0.16)",
    borderRadius: 180,
    height: 280,
    position: "absolute",
    right: -40,
    top: 16,
    width: 280,
  },
  glowSecondary: {
    backgroundColor: "rgba(215, 111, 85, 0.12)",
    borderRadius: 150,
    bottom: 18,
    height: 220,
    left: -56,
    position: "absolute",
    width: 220,
  },
  card: {
    alignItems: "center",
    backgroundColor: "rgba(255,253,248,0.96)",
    borderColor: "#D8D4C9",
    borderRadius: 30,
    borderWidth: 1,
    gap: 18,
    maxWidth: 440,
    paddingHorizontal: 22,
    paddingVertical: 24,
    shadowColor: "#202321",
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.08,
    shadowRadius: 28,
    width: "100%",
  },
  logoWrap: {
    alignItems: "center",
    backgroundColor: "#FFFDF8",
    borderColor: "#BBD5C9",
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
    color: "#48766B",
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1.8,
  },
  hint: {
    color: "#6E706B",
    fontSize: 13,
    lineHeight: 19,
    maxWidth: 280,
    textAlign: "center",
  },
  label: {
    color: "#202321",
    fontSize: 24,
    fontWeight: "900",
    lineHeight: 30,
    textAlign: "center",
  },
  progressCard: {
    alignSelf: "stretch",
    backgroundColor: "#F8F5EE",
    borderColor: "#D8D4C9",
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
    color: "#4F514B",
    flex: 1,
    fontSize: 13,
    fontWeight: "700",
  },
  progressTrack: {
    backgroundColor: "#DDEBE4",
    borderRadius: 999,
    height: 8,
    overflow: "hidden",
  },
  progressFill: {
    backgroundColor: "#48766B",
    borderRadius: 999,
    height: "100%",
    width: "62%",
  },
  previewStack: {
    gap: 10,
  },
  previewCardLarge: {
    backgroundColor: "#FFFDF8",
    borderColor: "#D8D4C9",
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
    backgroundColor: "#FFFDF8",
    borderColor: "#D8D4C9",
    borderRadius: 16,
    borderWidth: 1,
    flex: 1,
    gap: 8,
    padding: 12,
  },
  previewPill: {
    backgroundColor: "#BBD5C9",
    borderRadius: 999,
    height: 22,
    width: 74,
  },
  previewPillMuted: {
    backgroundColor: "#D8D4C9",
    borderRadius: 999,
    height: 22,
    width: 58,
  },
  previewLineStrong: {
    backgroundColor: "#C8DED2",
    borderRadius: 999,
    height: 12,
    width: "58%",
  },
  previewLineSoft: {
    backgroundColor: "#D8D4C9",
    borderRadius: 999,
    height: 10,
    width: "76%",
  },
  previewLineSoftWide: {
    backgroundColor: "#D8D4C9",
    borderRadius: 999,
    height: 10,
    width: "92%",
  },
});
