import { useRouter, type RelativePathString } from "expo-router";
import React from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "@/i18n";

type AuthMode = "sign-in" | "sign-up";

type AuthScreenShellProps = {
  children: React.ReactNode;
  title: string;
  subtitle: string;
  mode?: AuthMode;
  accentLabel?: string;
};

const modeTargets: Record<AuthMode, RelativePathString> = {
  "sign-in": "/sign-in" as RelativePathString,
  "sign-up": "/sign-up" as RelativePathString,
};

export const AuthScreenShell = ({
  accentLabel,
  children,
  title,
  subtitle,
  mode,
}: AuthScreenShellProps) => {
  const router = useRouter();
  const { t } = useTranslation(["auth", "common"]);

  const handleModeChange = (nextMode: AuthMode) => {
    if (nextMode === mode) {
      return;
    }
    router.replace(modeTargets[nextMode]);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right", "bottom"]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardRoot}
      >
        <View style={styles.backgroundLayer}>
          <View style={[styles.blob, styles.blobPrimary]} />
          <View style={[styles.blob, styles.blobAccent]} />
          <View style={[styles.blob, styles.blobMuted]} />
        </View>

        <ScrollView
          automaticallyAdjustKeyboardInsets
          contentContainerStyle={styles.scrollContent}
          keyboardDismissMode={Platform.OS === "ios" ? "interactive" : "on-drag"}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.heroBlock}>
            <View style={styles.brandPill}>
              <Text style={styles.brandPillLabel}>{t("common:app.mobileName")}</Text>
              <Text style={styles.brandPillMeta}>
                {accentLabel ?? t("auth:shell.studentAccess")}
              </Text>
            </View>

            <Text style={styles.heroTitle}>{title}</Text>
            <Text style={styles.heroSubtitle}>{subtitle}</Text>
          </View>

          <View style={styles.formPanel}>
            {mode ? (
              <View style={styles.modeSwitch}>
                <Pressable
                  onPress={() => handleModeChange("sign-in")}
                  style={({ pressed }) => [
                    styles.modeButton,
                    mode === "sign-in" && styles.modeButtonActive,
                    pressed && styles.modeButtonPressed,
                  ]}
                >
                  <Text
                    style={[
                      styles.modeButtonLabel,
                      mode === "sign-in" && styles.modeButtonLabelActive,
                    ]}
                  >
                    {t("auth:shell.signInTab")}
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => handleModeChange("sign-up")}
                  style={({ pressed }) => [
                    styles.modeButton,
                    mode === "sign-up" && styles.modeButtonActive,
                    pressed && styles.modeButtonPressed,
                  ]}
                >
                  <Text
                    style={[
                      styles.modeButtonLabel,
                      mode === "sign-up" && styles.modeButtonLabelActive,
                    ]}
                  >
                    {t("auth:shell.signUpTab")}
                  </Text>
                </Pressable>
              </View>
            ) : null}

            {children}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#08111F",
  },
  keyboardRoot: {
    flex: 1,
  },
  backgroundLayer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#08111F",
  },
  blob: {
    position: "absolute",
    borderRadius: 999,
  },
  blobPrimary: {
    backgroundColor: "rgba(45, 212, 191, 0.18)",
    height: 280,
    right: -80,
    top: -30,
    width: 280,
  },
  blobAccent: {
    backgroundColor: "rgba(251, 146, 60, 0.16)",
    height: 240,
    left: -90,
    top: 220,
    width: 240,
  },
  blobMuted: {
    backgroundColor: "rgba(37, 99, 235, 0.14)",
    bottom: -60,
    height: 260,
    left: 80,
    width: 260,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "flex-start",
    paddingHorizontal: 20,
    paddingBottom: 32,
    paddingTop: 24,
  },
  heroBlock: {
    gap: 10,
    marginBottom: 14,
  },
  brandPill: {
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    borderColor: "rgba(255, 255, 255, 0.12)",
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  brandPillLabel: {
    color: "#F8FAFC",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  brandPillMeta: {
    color: "#8FB3FF",
    fontSize: 12,
    fontWeight: "600",
  },
  heroTitle: {
    color: "#F8FAFC",
    fontSize: 28,
    fontWeight: "800",
    letterSpacing: -0.7,
    lineHeight: 33,
    maxWidth: 280,
  },
  heroSubtitle: {
    color: "#CBD5E1",
    fontSize: 13,
    lineHeight: 19,
    maxWidth: 300,
  },
  formPanel: {
    backgroundColor: "#F8FAFC",
    borderColor: "rgba(255, 255, 255, 0.15)",
    borderRadius: 26,
    borderWidth: 1,
    gap: 18,
    paddingHorizontal: 18,
    paddingVertical: 18,
    shadowColor: "#020617",
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.22,
    shadowRadius: 28,
    elevation: 10,
  },
  modeSwitch: {
    backgroundColor: "#E2E8F0",
    borderRadius: 16,
    flexDirection: "row",
    gap: 8,
    padding: 6,
  },
  modeButton: {
    alignItems: "center",
    borderRadius: 12,
    flex: 1,
    justifyContent: "center",
    minHeight: 46,
  },
  modeButtonActive: {
    backgroundColor: "#FFFFFF",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 3,
  },
  modeButtonPressed: {
    opacity: 0.92,
  },
  modeButtonLabel: {
    color: "#475569",
    fontSize: 14,
    fontWeight: "700",
  },
  modeButtonLabelActive: {
    color: "#0F172A",
  },
});
