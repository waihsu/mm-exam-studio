import { useRouter, type RelativePathString } from "expo-router";
import React, { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import { AuthScreenShell } from "./auth-screen-shell";
import { AuthBanner, AuthButton, AuthField } from "./auth-ui";
import { authUiStyles } from "./auth-ui.styles";
import { useVerifyTwoFactorMutation } from "../hooks/use-verify-two-factor-mutation";

type MfaMethod = "totp" | "backup";

export const MfaScreen = () => {
  const { t } = useTranslation("auth");
  const router = useRouter();
  const [code, setCode] = useState("");
  const [method, setMethod] = useState<MfaMethod>("totp");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const verifyMutation = useVerifyTwoFactorMutation();

  const canSubmit = useMemo(
    () => code.trim().length > 0 && !verifyMutation.isPending,
    [code, verifyMutation.isPending]
  );

  const verify = async () => {
    if (!canSubmit) return;

    setErrorMessage(null);

    try {
      await verifyMutation.mutateAsync({
        method,
        code: code.trim(),
        trustDevice: true,
      });
      router.replace("/practice" as RelativePathString);
    } catch (error) {
      setErrorMessage(
        error instanceof Error && error.message.trim().length > 0
          ? error.message
          : t("mfa.failed")
      );
    }
  };

  return (
    <AuthScreenShell
      accentLabel={t("mfa.accent")}
      subtitle={t("mfa.subtitle")}
      title={t("mfa.title")}
    >
      <View style={authUiStyles.sectionHeader}>
        <Text style={authUiStyles.sectionKicker}>{t("mfa.kicker")}</Text>
        <Text style={authUiStyles.sectionTitle}>{t("mfa.sectionTitle")}</Text>
      </View>

      <View style={styles.switchRow}>
        <Pressable
          style={({ pressed }) => [
            styles.switchButton,
            method === "totp" && styles.switchButtonActive,
            pressed && styles.switchButtonPressed,
          ]}
          onPress={() => setMethod("totp")}
        >
          <Text
            style={[
              styles.switchButtonLabel,
              method === "totp" && styles.switchButtonLabelActive,
            ]}
          >
            {t("mfa.authenticator")}
          </Text>
        </Pressable>

        <Pressable
          style={({ pressed }) => [
            styles.switchButton,
            method === "backup" && styles.switchButtonActive,
            pressed && styles.switchButtonPressed,
          ]}
          onPress={() => setMethod("backup")}
        >
          <Text
            style={[
              styles.switchButtonLabel,
              method === "backup" && styles.switchButtonLabelActive,
            ]}
          >
            {t("mfa.backupCode")}
          </Text>
        </Pressable>
      </View>

      <AuthField
        autoCapitalize="characters"
        autoCorrect={false}
        keyboardType={method === "totp" ? "number-pad" : "default"}
        label={
          method === "totp"
            ? t("mfa.authenticatorCodeLabel")
            : t("mfa.backupCodeLabel")
        }
        placeholder={method === "totp" ? "123456" : "ABCD-EFGH"}
        textContentType="oneTimeCode"
        value={code}
        onChangeText={setCode}
      />

      <AuthBanner message={errorMessage} tone="error" />

      <View style={authUiStyles.actionStack}>
        <AuthButton
          disabled={!canSubmit}
          label={t("mfa.verify")}
          loading={verifyMutation.isPending}
          onPress={verify}
        />
        <AuthButton
          label={t("mfa.backToSignIn")}
          onPress={() => router.replace("/sign-in" as RelativePathString)}
          variant="secondary"
        />
      </View>
    </AuthScreenShell>
  );
};

const styles = StyleSheet.create({
  switchRow: {
    flexDirection: "row",
    gap: 8,
  },
  switchButton: {
    alignItems: "center",
    borderColor: "#CBD5E1",
    borderRadius: 10,
    borderWidth: 1,
    flex: 1,
    justifyContent: "center",
    minHeight: 42,
  },
  switchButtonActive: {
    backgroundColor: "#EFF6FF",
    borderColor: "#60A5FA",
  },
  switchButtonPressed: {
    opacity: 0.85,
  },
  switchButtonLabel: {
    color: "#475569",
    fontSize: 13,
    fontWeight: "700",
  },
  switchButtonLabelActive: {
    color: "#1D4ED8",
  },
});
