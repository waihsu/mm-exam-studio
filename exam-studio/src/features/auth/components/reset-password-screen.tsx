import {
  useLocalSearchParams,
  useRouter,
  type RelativePathString,
} from "expo-router";
import React, { useMemo, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { useTranslation } from "@/i18n";
import { AuthScreenShell } from "./auth-screen-shell";
import { AuthBanner, AuthButton, AuthField } from "./auth-ui";
import { authUiStyles } from "./auth-ui.styles";
import { useResetPasswordMutation } from "../hooks/use-reset-password-mutation";

const MIN_PASSWORD_LENGTH = 8;

const readToken = (value: string | string[] | undefined) => {
  if (Array.isArray(value)) {
    return value[0]?.trim() ?? "";
  }
  return value?.trim() ?? "";
};

export const ResetPasswordScreen = () => {
  const router = useRouter();
  const { t } = useTranslation("auth");
  const params = useLocalSearchParams<{ token?: string | string[] }>();
  const token = readToken(params.token);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const resetMutation = useResetPasswordMutation();

  const canSubmit = useMemo(
    () =>
      token.length > 0 &&
      newPassword.length >= MIN_PASSWORD_LENGTH &&
      confirmPassword === newPassword &&
      !resetMutation.isPending,
    [confirmPassword, newPassword, resetMutation.isPending, token.length]
  );

  const submit = async () => {
    if (!token) {
      setErrorMessage(t("resetPassword.invalidLink"));
      return;
    }

    if (newPassword.length < MIN_PASSWORD_LENGTH) {
      setErrorMessage(t("resetPassword.passwordTooShort"));
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage(t("resetPassword.confirmMismatch"));
      return;
    }

    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      await resetMutation.mutateAsync({
        token,
        newPassword,
      });
      setSuccessMessage(t("resetPassword.success"));
    } catch (error) {
      setErrorMessage(
        error instanceof Error && error.message.trim().length > 0
          ? error.message
          : t("resetPassword.failed")
      );
    }
  };

  return (
    <AuthScreenShell
      accentLabel={t("resetPassword.kicker")}
      subtitle={t("resetPassword.subtitle")}
      title={t("resetPassword.title")}
    >
      <View style={authUiStyles.sectionHeader}>
        <Text style={authUiStyles.sectionKicker}>
          {t("resetPassword.kicker")}
        </Text>
        <Text style={authUiStyles.sectionTitle}>
          {t("resetPassword.sectionTitle")}
        </Text>
      </View>

      <AuthField
        autoCapitalize="none"
        autoComplete="new-password"
        autoCorrect={false}
        helperText={t("resetPassword.helper")}
        label={t("resetPassword.newPasswordLabel")}
        placeholder={t("resetPassword.newPasswordPlaceholder")}
        secureTextEntry
        secureToggle
        textContentType="newPassword"
        value={newPassword}
        onChangeText={value => {
          setNewPassword(value);
          if (errorMessage) {
            setErrorMessage(null);
          }
        }}
      />

      <AuthField
        autoCapitalize="none"
        autoComplete="new-password"
        autoCorrect={false}
        label={t("resetPassword.confirmPasswordLabel")}
        placeholder={t("resetPassword.confirmPasswordPlaceholder")}
        secureTextEntry
        secureToggle
        textContentType="newPassword"
        value={confirmPassword}
        onChangeText={value => {
          setConfirmPassword(value);
          if (errorMessage) {
            setErrorMessage(null);
          }
        }}
      />

      <AuthBanner
        message={
          errorMessage ?? (!token ? t("resetPassword.invalidLink") : null)
        }
        tone="error"
      />
      <AuthBanner message={successMessage} tone="success" />

      <View style={authUiStyles.actionStack}>
        <AuthButton
          disabled={!canSubmit}
          label={t("resetPassword.submit")}
          loading={resetMutation.isPending}
          onPress={submit}
        />
        <Pressable
          onPress={() => router.replace("/sign-in" as RelativePathString)}
          style={authUiStyles.textLink}
        >
          <Text style={authUiStyles.textLinkLabel}>
            {t("resetPassword.backToSignIn")}
          </Text>
        </Pressable>
      </View>
    </AuthScreenShell>
  );
};
