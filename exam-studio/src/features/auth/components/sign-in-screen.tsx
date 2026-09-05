import { useRouter, type RelativePathString } from "expo-router";
import React, { useMemo, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { useTranslation } from "@/i18n";
import { AuthScreenShell } from "./auth-screen-shell";
import { AuthBanner, AuthButton, AuthConsent, AuthField } from "./auth-ui";
import { authUiStyles } from "./auth-ui.styles";
import { useSignInEmailMutation } from "../hooks/use-sign-in-email-mutation";

export const SignInScreen = () => {
  const router = useRouter();
  const { t } = useTranslation("auth");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [acceptedPolicy, setAcceptedPolicy] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const signInMutation = useSignInEmailMutation();
  const submitting = signInMutation.isPending;

  const canSubmit = useMemo(
    () =>
      email.trim().length > 0 &&
      password.length > 0 &&
      acceptedPolicy &&
      !submitting,
    [acceptedPolicy, email, password, submitting]
  );

  const submit = async () => {
    if (!acceptedPolicy) {
      setErrorMessage(t("consent.required"));
      return;
    }
    if (!canSubmit) return;

    setErrorMessage(null);
    setInfoMessage(null);

    try {
      const result = await signInMutation.mutateAsync({
        email: email.trim(),
        password,
      });

      if (result.requiresTwoFactor) {
        setInfoMessage(result.message ?? t("signIn.twoFactorRequired"));
        router.replace("/mfa");
        return;
      }

      router.replace("/practice" as RelativePathString);
    } catch (error) {
      const resolvedMessage =
        error instanceof Error && error.message.trim().length > 0
          ? error.message
          : t("signIn.failed");

      setErrorMessage(
        resolvedMessage.toLowerCase().includes("verify your email")
          ? t("signIn.emailNotVerified")
          : resolvedMessage
      );
    }
  };

  return (
    <AuthScreenShell
      accentLabel={t("shell.signIn")}
      mode="sign-in"
      subtitle={t("signIn.subtitle")}
      title={t("signIn.title")}
    >
      <View style={authUiStyles.sectionHeader}>
        <Text style={authUiStyles.sectionKicker}>{t("signIn.kicker")}</Text>
        <Text style={authUiStyles.sectionTitle}>
          {t("signIn.sectionTitle")}
        </Text>
      </View>

      <AuthField
        autoCapitalize="none"
        autoComplete="email"
        autoCorrect={false}
        keyboardType="email-address"
        label={t("signIn.emailLabel")}
        placeholder={t("signIn.emailPlaceholder")}
        returnKeyType="next"
        textContentType="emailAddress"
        value={email}
        onChangeText={setEmail}
      />

      <AuthField
        autoCapitalize="none"
        autoComplete="password"
        autoCorrect={false}
        label={t("signIn.passwordLabel")}
        placeholder={t("signIn.passwordPlaceholder")}
        secureTextEntry
        secureToggle
        textContentType="password"
        value={password}
        onChangeText={setPassword}
      />

      <AuthBanner message={errorMessage} tone="error" />
      <AuthBanner message={infoMessage} tone="info" />
      <AuthConsent
        checked={acceptedPolicy}
        labelPrefix={t("consent.label")}
        linkLabel={t("consent.linkLabel")}
        onPressLink={() => router.push("/legal" as RelativePathString)}
        onToggle={() => {
          setErrorMessage(current =>
            current === t("consent.required") ? null : current
          );
          setAcceptedPolicy(current => !current);
        }}
      />

      <View style={authUiStyles.actionStack}>
        <AuthButton
          disabled={!canSubmit}
          label={t("signIn.submit")}
          loading={submitting}
          onPress={submit}
        />
        <Pressable
          onPress={() => router.push("/forgot-password" as RelativePathString)}
          style={authUiStyles.textLink}
        >
          <Text style={authUiStyles.textLinkLabel}>
            {t("signIn.forgotPassword")}
          </Text>
        </Pressable>
        <Pressable
          onPress={() => router.replace("/sign-up" as RelativePathString)}
          style={authUiStyles.textLink}
        >
          <Text style={authUiStyles.textLinkLabel}>
            {t("signIn.createAccount")}
          </Text>
        </Pressable>
      </View>
    </AuthScreenShell>
  );
};
