import { useRouter, type RelativePathString } from "expo-router";
import React, { useMemo, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { useTranslation } from "@/i18n";
import { AuthScreenShell } from "./auth-screen-shell";
import { AuthBanner, AuthButton, AuthField } from "./auth-ui";
import { authUiStyles } from "./auth-ui.styles";
import { useRequestPasswordResetMutation } from "../hooks/use-request-password-reset-mutation";

export const ForgotPasswordScreen = () => {
  const router = useRouter();
  const { t } = useTranslation("auth");
  const [email, setEmail] = useState("");
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const resetMutation = useRequestPasswordResetMutation();

  const canSubmit = useMemo(
    () => email.trim().length >= 3 && !resetMutation.isPending,
    [email, resetMutation.isPending]
  );

  const submit = async () => {
    if (!canSubmit) {
      return;
    }

    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const result = await resetMutation.mutateAsync({
        email: email.trim(),
      });
      setSuccessMessage(result.message);
    } catch (error) {
      setErrorMessage(
        error instanceof Error && error.message.trim().length > 0
          ? error.message
          : t("forgotPassword.failed")
      );
    }
  };

  return (
    <AuthScreenShell
      accentLabel={t("forgotPassword.kicker")}
      subtitle={t("forgotPassword.subtitle")}
      title={t("forgotPassword.title")}
    >
      <View style={authUiStyles.sectionHeader}>
        <Text style={authUiStyles.sectionKicker}>
          {t("forgotPassword.kicker")}
        </Text>
        <Text style={authUiStyles.sectionTitle}>
          {t("forgotPassword.sectionTitle")}
        </Text>
      </View>

      <AuthField
        autoCapitalize="none"
        autoComplete="email"
        autoCorrect={false}
        keyboardType="email-address"
        label={t("forgotPassword.emailLabel")}
        placeholder={t("forgotPassword.emailPlaceholder")}
        textContentType="emailAddress"
        value={email}
        onChangeText={value => {
          setEmail(value);
          if (errorMessage) {
            setErrorMessage(null);
          }
          if (successMessage) {
            setSuccessMessage(null);
          }
        }}
      />

      <AuthBanner message={errorMessage} tone="error" />
      <AuthBanner message={successMessage} tone="success" />

      <View style={authUiStyles.actionStack}>
        <AuthButton
          disabled={!canSubmit}
          label={t("forgotPassword.submit")}
          loading={resetMutation.isPending}
          onPress={submit}
        />
        <Pressable
          onPress={() => router.replace("/sign-in" as RelativePathString)}
          style={authUiStyles.textLink}
        >
          <Text style={authUiStyles.textLinkLabel}>
            {t("forgotPassword.backToSignIn")}
          </Text>
        </Pressable>
      </View>
    </AuthScreenShell>
  );
};
