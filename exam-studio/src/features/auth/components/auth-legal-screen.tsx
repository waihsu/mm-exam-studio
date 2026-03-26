import { useRouter } from "expo-router";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { AuthScreenShell } from "./auth-screen-shell";
import { authUiStyles } from "./auth-ui";
import { useTranslation } from "@/i18n";

export const AuthLegalScreen = () => {
  const router = useRouter();
  const { t } = useTranslation("auth");

  const sections = [
    {
      title: t("legal.privacyTitle"),
      body: t("legal.privacyBody"),
    },
    {
      title: t("legal.dataUseTitle"),
      body: t("legal.dataUseBody"),
    },
    {
      title: t("legal.securityTitle"),
      body: t("legal.securityBody"),
    },
    {
      title: t("legal.userResponsibilitiesTitle"),
      body: t("legal.userResponsibilitiesBody"),
    },
    {
      title: t("legal.supportTitle"),
      body: t("legal.supportBody"),
    },
  ];

  return (
    <AuthScreenShell
      accentLabel={t("legal.kicker")}
      subtitle={t("legal.subtitle")}
      title={t("legal.title")}
    >
      <View style={styles.headerRow}>
        <Pressable onPress={() => router.back()} style={authUiStyles.textLink}>
          <Text style={authUiStyles.textLinkLabel}>{t("legal.back")}</Text>
        </Pressable>
        <View style={styles.updatedPill}>
          <Text style={styles.updatedPillLabel}>{t("legal.updatedAt")}</Text>
        </View>
      </View>

      <View style={styles.noticeCard}>
        <Text style={styles.noticeTitle}>{t("legal.noticeTitle")}</Text>
        <Text style={styles.noticeBody}>{t("legal.noticeBody")}</Text>
      </View>

      {sections.map((section) => (
        <View key={section.title} style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>{section.title}</Text>
          <Text style={styles.sectionBody}>{section.body}</Text>
        </View>
      ))}
    </AuthScreenShell>
  );
};

const styles = StyleSheet.create({
  headerRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  updatedPill: {
    backgroundColor: "#E0F2FE",
    borderColor: "#BAE6FD",
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  updatedPillLabel: {
    color: "#0C4A6E",
    fontSize: 12,
    fontWeight: "700",
  },
  noticeCard: {
    backgroundColor: "#FFF7ED",
    borderColor: "#FED7AA",
    borderRadius: 18,
    borderWidth: 1,
    gap: 8,
    padding: 16,
  },
  noticeTitle: {
    color: "#9A3412",
    fontSize: 15,
    fontWeight: "800",
  },
  noticeBody: {
    color: "#7C2D12",
    fontSize: 13,
    lineHeight: 20,
  },
  sectionCard: {
    backgroundColor: "#FFFFFF",
    borderColor: "#E2E8F0",
    borderRadius: 20,
    borderWidth: 1,
    gap: 8,
    padding: 16,
  },
  sectionTitle: {
    color: "#0F172A",
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: -0.2,
  },
  sectionBody: {
    color: "#475569",
    fontSize: 13,
    lineHeight: 21,
  },
});
