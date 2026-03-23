import { SymbolView } from "expo-symbols";
import { useRouter, type RelativePathString } from "expo-router";
import React, { useEffect } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import { useAuthSessionQuery } from "@/features/auth/hooks/use-auth-session-query";
import { markAppOnboardingSeen } from "@/features/onboarding/services/app-onboarding-store";
import { SettingsCard, SettingsPage } from "./settings-ui";
import { settingsUiStyles } from "./settings-ui.styles";

type HelpSection = {
  title: string;
  description: string;
  icon: React.ComponentProps<typeof SymbolView>["name"];
  accentColor: string;
  accentSoft: string;
  steps: string[];
  preview: "practice" | "papers" | "subscription";
};

const HELP_SECTIONS_META = [
  {
    icon: {
      ios: "play.circle.fill",
      android: "play_circle",
      web: "play_circle",
    },
    accentColor: "#1D4ED8",
    accentSoft: "#DBEAFE",
    preview: "practice",
  },
  {
    icon: {
      ios: "doc.text.fill",
      android: "description",
      web: "description",
    },
    accentColor: "#B45309",
    accentSoft: "#FEF3C7",
    preview: "papers",
  },
  {
    icon: {
      ios: "creditcard.fill",
      android: "credit_card",
      web: "credit_card",
    },
    accentColor: "#047857",
    accentSoft: "#DCFCE7",
    preview: "subscription",
  },
];

type HelpSectionCopy = {
  title: string;
  description: string;
  steps: string[];
};

type QuickActionCopy = {
  title: string;
  hint: string;
};

export const SettingsHelpScreen = () => {
  const { t } = useTranslation("settingsDetail");
  const router = useRouter();
  const authSessionQuery = useAuthSessionQuery();
  const helpSectionsCopy = t("help.sections", { returnObjects: true }) as HelpSectionCopy[];
  const helpSections = HELP_SECTIONS_META.map((meta, index) => ({
    ...meta,
    ...helpSectionsCopy[index],
  })) as HelpSection[];
  const quickActionsCopy = t("help.quickActions", { returnObjects: true }) as QuickActionCopy[];
  const quickActions = [
    { href: "/practice", ...quickActionsCopy[0] },
    { href: "/papers", ...quickActionsCopy[1] },
    { href: "/settings/subscription", ...quickActionsCopy[2] },
  ] as const;

  useEffect(() => {
    const userId = authSessionQuery.data?.user.id;
    if (!userId) {
      return;
    }

    void markAppOnboardingSeen(userId);
  }, [authSessionQuery.data?.user.id]);

  return (
    <SettingsPage
      title={t("help.title")}
      subtitle={t("help.subtitle")}
      showBack
    >
      <SettingsCard>
        <Text style={settingsUiStyles.cardTitle}>{t("help.quickHelp")}</Text>
        <View style={styles.heroCard}>
          <View style={styles.heroCopy}>
            <Text style={styles.heroTitle}>{t("help.heroTitle")}</Text>
            <Text style={settingsUiStyles.metaText}>{t("help.heroBody")}</Text>
          </View>
          <View style={styles.heroMockPhone}>
            <View style={styles.heroMockHeader}>
              <View style={styles.heroMockDot} />
              <View style={[styles.heroMockPill, styles.heroMockPillWide]} />
            </View>
            <View style={styles.heroMockPanel}>
              <View style={[styles.heroMockLine, styles.heroMockLineStrong]} />
              <View style={styles.heroMockLine} />
              <View style={styles.heroMockGrid}>
                <View style={styles.heroMockCard} />
                <View style={styles.heroMockCard} />
              </View>
            </View>
          </View>
        </View>
      </SettingsCard>

      {helpSections.map((section) => (
        <SettingsCard key={section.title}>
          <View style={styles.sectionHeader}>
            <View style={[styles.iconWrap, { backgroundColor: section.accentSoft }]}>
              <SymbolView name={section.icon} size={18} tintColor={section.accentColor} />
            </View>
            <View style={styles.sectionTextWrap}>
              <Text style={settingsUiStyles.cardTitle}>{section.title}</Text>
              <Text style={settingsUiStyles.settingHint}>{section.description}</Text>
            </View>
          </View>

          <SectionPreview section={section} />

          <View style={styles.stepsList}>
            {section.steps.map((step, index) => (
              <View key={`${section.title}-${index + 1}`} style={styles.stepRow}>
                <View style={[styles.stepNumber, { backgroundColor: section.accentSoft }]}>
                  <Text style={[styles.stepNumberLabel, { color: section.accentColor }]}>
                    {index + 1}
                  </Text>
                </View>
                <Text style={styles.stepText}>{step}</Text>
              </View>
            ))}
          </View>
        </SettingsCard>
      ))}

      <SettingsCard>
        <Text style={settingsUiStyles.cardTitle}>{t("help.startHere")}</Text>
        <Text style={settingsUiStyles.metaText}>{t("help.startHereBody")}</Text>
        <View style={styles.quickActionList}>
          {quickActions.map((action) => (
            <Pressable
              key={action.href}
              style={({ pressed }) => [styles.quickActionCard, pressed && settingsUiStyles.buttonPressed]}
              onPress={() => router.push(action.href as RelativePathString)}
            >
              <Text style={styles.quickActionTitle}>{action.title}</Text>
              <Text style={settingsUiStyles.settingHint}>{action.hint}</Text>
            </Pressable>
          ))}
        </View>
      </SettingsCard>
    </SettingsPage>
  );
};

const SectionPreview = ({ section }: { section: HelpSection }) => {
  if (section.preview === "practice") {
    return (
      <View style={styles.previewCard}>
        <View style={styles.previewTopRow}>
          <View style={[styles.previewPill, { backgroundColor: section.accentSoft }]} />
          <View style={styles.previewTinyPill} />
        </View>
        <View style={styles.previewSearchBar} />
        <View style={styles.previewGrid}>
          <View style={[styles.previewGridCard, { borderColor: section.accentSoft }]}>
            <View style={[styles.previewIconBlob, { backgroundColor: section.accentSoft }]} />
            <View style={[styles.previewLineShort, { backgroundColor: section.accentColor }]} />
            <View style={styles.previewLineMuted} />
          </View>
          <View style={[styles.previewGridCard, { borderColor: section.accentSoft }]}>
            <View style={[styles.previewIconBlob, { backgroundColor: section.accentSoft }]} />
            <View style={[styles.previewLineShort, { backgroundColor: section.accentColor }]} />
            <View style={styles.previewLineMuted} />
          </View>
        </View>
      </View>
    );
  }

  if (section.preview === "papers") {
    return (
      <View style={styles.previewCard}>
        <View style={styles.previewTopRow}>
          <View style={[styles.previewPill, { backgroundColor: section.accentSoft }]} />
          <View style={styles.previewTinyPill} />
        </View>
        <View style={styles.previewFormCard}>
          <View style={[styles.previewLineStrongBlock, { backgroundColor: section.accentSoft }]} />
          <View style={styles.previewInputLine} />
          <View style={styles.previewInputLine} />
          <View style={styles.previewButtonRow}>
            <View style={[styles.previewActionButton, { backgroundColor: section.accentSoft }]} />
            <View style={styles.previewGhostButton} />
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.previewCard}>
      <View style={styles.previewTopRow}>
        <View style={[styles.previewPill, { backgroundColor: section.accentSoft }]} />
        <View style={styles.previewTinyPill} />
      </View>
      <View style={styles.previewStack}>
        <View style={[styles.previewStatusCard, { borderColor: section.accentSoft }]}>
          <View style={[styles.previewStatusBadge, { backgroundColor: section.accentSoft }]} />
          <View style={styles.previewStatusTextWrap}>
            <View style={[styles.previewLineShort, { backgroundColor: section.accentColor }]} />
            <View style={styles.previewLineMuted} />
          </View>
        </View>
        <View style={[styles.previewStatusCard, { borderColor: section.accentSoft }]}>
          <View style={[styles.previewStatusBadge, { backgroundColor: section.accentSoft }]} />
          <View style={styles.previewStatusTextWrap}>
            <View style={[styles.previewLineShort, { backgroundColor: section.accentColor }]} />
            <View style={styles.previewLineMuted} />
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  heroCard: {
    backgroundColor: "#F8FAFC",
    borderColor: "#CBD5E1",
    borderRadius: 14,
    borderWidth: 1,
    gap: 14,
    padding: 14,
  },
  heroCopy: {
    gap: 8,
  },
  heroTitle: {
    color: "#0F172A",
    fontSize: 15,
    fontWeight: "800",
  },
  heroMockPhone: {
    backgroundColor: "#FFFFFF",
    borderColor: "#D8DEE9",
    borderRadius: 18,
    borderWidth: 1,
    gap: 10,
    padding: 12,
  },
  heroMockHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
  },
  heroMockDot: {
    backgroundColor: "#BFDBFE",
    borderRadius: 999,
    height: 10,
    width: 10,
  },
  heroMockPill: {
    backgroundColor: "#E2E8F0",
    borderRadius: 999,
    height: 10,
  },
  heroMockPillWide: {
    width: 84,
  },
  heroMockPanel: {
    backgroundColor: "#F8FAFC",
    borderColor: "#E2E8F0",
    borderRadius: 14,
    borderWidth: 1,
    gap: 8,
    padding: 10,
  },
  heroMockLine: {
    backgroundColor: "#D8DEE9",
    borderRadius: 999,
    height: 8,
    width: "66%",
  },
  heroMockLineStrong: {
    backgroundColor: "#93C5FD",
    width: "52%",
  },
  heroMockGrid: {
    flexDirection: "row",
    gap: 8,
  },
  heroMockCard: {
    backgroundColor: "#FFFFFF",
    borderColor: "#DBEAFE",
    borderRadius: 12,
    borderWidth: 1,
    flex: 1,
    height: 58,
  },
  sectionHeader: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 12,
  },
  iconWrap: {
    alignItems: "center",
    borderRadius: 14,
    height: 40,
    justifyContent: "center",
    width: 40,
  },
  sectionTextWrap: {
    flex: 1,
    gap: 2,
  },
  stepsList: {
    gap: 10,
  },
  previewCard: {
    backgroundColor: "#F8FAFC",
    borderColor: "#E2E8F0",
    borderRadius: 14,
    borderWidth: 1,
    gap: 10,
    padding: 12,
  },
  previewTopRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  previewPill: {
    borderRadius: 999,
    height: 10,
    width: 84,
  },
  previewTinyPill: {
    backgroundColor: "#E2E8F0",
    borderRadius: 999,
    height: 10,
    width: 44,
  },
  previewSearchBar: {
    backgroundColor: "#FFFFFF",
    borderColor: "#D8DEE9",
    borderRadius: 10,
    borderWidth: 1,
    height: 34,
  },
  previewGrid: {
    flexDirection: "row",
    gap: 8,
  },
  previewGridCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1,
    flex: 1,
    gap: 8,
    padding: 10,
  },
  previewIconBlob: {
    borderRadius: 999,
    height: 24,
    width: 24,
  },
  previewLineShort: {
    borderRadius: 999,
    height: 8,
    width: "44%",
  },
  previewLineMuted: {
    backgroundColor: "#D8DEE9",
    borderRadius: 999,
    height: 8,
    width: "72%",
  },
  previewFormCard: {
    backgroundColor: "#FFFFFF",
    borderColor: "#E2E8F0",
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
    padding: 10,
  },
  previewLineStrongBlock: {
    borderRadius: 10,
    height: 18,
    width: "58%",
  },
  previewInputLine: {
    backgroundColor: "#F8FAFC",
    borderColor: "#E2E8F0",
    borderRadius: 10,
    borderWidth: 1,
    height: 34,
  },
  previewButtonRow: {
    flexDirection: "row",
    gap: 8,
  },
  previewActionButton: {
    borderRadius: 10,
    flex: 1,
    height: 34,
  },
  previewGhostButton: {
    backgroundColor: "#FFFFFF",
    borderColor: "#E2E8F0",
    borderRadius: 10,
    borderWidth: 1,
    flex: 1,
    height: 34,
  },
  previewStack: {
    gap: 8,
  },
  previewStatusCard: {
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: "row",
    gap: 10,
    padding: 10,
  },
  previewStatusBadge: {
    borderRadius: 999,
    height: 28,
    width: 28,
  },
  previewStatusTextWrap: {
    flex: 1,
    gap: 6,
  },
  stepRow: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 10,
  },
  stepNumber: {
    alignItems: "center",
    borderRadius: 999,
    height: 24,
    justifyContent: "center",
    marginTop: 1,
    width: 24,
  },
  stepNumberLabel: {
    fontSize: 12,
    fontWeight: "800",
  },
  stepText: {
    color: "#334155",
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  quickActionList: {
    gap: 10,
  },
  quickActionCard: {
    backgroundColor: "#F8FAFC",
    borderColor: "#CBD5E1",
    borderRadius: 12,
    borderWidth: 1,
    gap: 4,
    padding: 12,
  },
  quickActionTitle: {
    color: "#0F172A",
    fontSize: 14,
    fontWeight: "700",
  },
});
