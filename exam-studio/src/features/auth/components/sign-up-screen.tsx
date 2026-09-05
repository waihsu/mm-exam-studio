import { useRouter, type RelativePathString } from "expo-router";
import React, { useMemo, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { useTranslation } from "@/i18n";
import { AuthScreenShell } from "./auth-screen-shell";
import { AuthBanner, AuthButton, AuthConsent, AuthField } from "./auth-ui";
import { authUiStyles } from "./auth-ui.styles";
import { useSignUpEmailMutation } from "../hooks/use-sign-up-email-mutation";

const MIN_PASSWORD_LENGTH = 8;

export const SignUpScreen = () => {
  const router = useRouter();
  const { t } = useTranslation("auth");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [acceptedPolicy, setAcceptedPolicy] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const signUpMutation = useSignUpEmailMutation();
  const submitting = signUpMutation.isPending;

  const passwordHelper = useMemo(() => {
    if (password.length === 0) {
      return t("signUp.helperDefault");
    }
    if (password.length < MIN_PASSWORD_LENGTH) {
      return t("signUp.helperAddMore", {
        count: MIN_PASSWORD_LENGTH - password.length,
      });
    }
    if (confirmPassword.length > 0 && confirmPassword !== password) {
      return t("signUp.helperMismatch");
    }
    return t("signUp.helperGood");
  }, [confirmPassword, password, t]);

  const canSubmit = useMemo(
    () =>
      name.trim().length > 1 &&
      email.trim().length > 0 &&
      password.length >= MIN_PASSWORD_LENGTH &&
      confirmPassword === password &&
      acceptedPolicy &&
      !submitting,
    [acceptedPolicy, confirmPassword, email, name, password, submitting]
  );

  const submit = async () => {
    if (!canSubmit) {
      if (!acceptedPolicy) {
        setErrorMessage(t("consent.required"));
      } else if (password !== confirmPassword) {
        setErrorMessage(t("signUp.confirmMismatch"));
      } else if (password.length < MIN_PASSWORD_LENGTH) {
        setErrorMessage(t("signUp.passwordTooShort"));
      }
      return;
    }

    setErrorMessage(null);

    try {
      const result = await signUpMutation.mutateAsync({
        name: name.trim(),
        email: email.trim(),
        password,
      });
      router.replace({
        pathname: "/verify-email-pending" as RelativePathString,
        params: { email: result.email },
      });
    } catch (error) {
      setErrorMessage(
        error instanceof Error && error.message.trim().length > 0
          ? error.message
          : t("signUp.failed")
      );
    }
  };

  return (
    <AuthScreenShell
      accentLabel={t("shell.signUp")}
      mode="sign-up"
      subtitle={t("signUp.subtitle")}
      title={t("signUp.title")}
    >
      <View style={authUiStyles.sectionHeader}>
        <Text style={authUiStyles.sectionKicker}>{t("signUp.kicker")}</Text>
        <Text style={authUiStyles.sectionTitle}>
          {t("signUp.sectionTitle")}
        </Text>
      </View>

      <AuthField
        autoCapitalize="words"
        autoComplete="name"
        label={t("signUp.nameLabel")}
        placeholder={t("signUp.namePlaceholder")}
        returnKeyType="next"
        textContentType="name"
        value={name}
        onChangeText={setName}
      />

      <AuthField
        autoCapitalize="none"
        autoComplete="email"
        autoCorrect={false}
        keyboardType="email-address"
        label={t("signUp.emailLabel")}
        placeholder={t("signUp.emailPlaceholder")}
        returnKeyType="next"
        textContentType="emailAddress"
        value={email}
        onChangeText={setEmail}
      />

      <AuthField
        autoCapitalize="none"
        autoComplete="new-password"
        autoCorrect={false}
        helperText={passwordHelper}
        label={t("signUp.passwordLabel")}
        placeholder={t("signUp.passwordPlaceholder")}
        secureTextEntry
        secureToggle
        textContentType="newPassword"
        value={password}
        onChangeText={setPassword}
      />

      <AuthField
        autoCapitalize="none"
        autoComplete="new-password"
        autoCorrect={false}
        label={t("signUp.confirmPasswordLabel")}
        placeholder={t("signUp.confirmPasswordPlaceholder")}
        secureTextEntry
        secureToggle
        textContentType="newPassword"
        value={confirmPassword}
        onChangeText={setConfirmPassword}
      />

      <AuthBanner message={errorMessage} tone="error" />
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
          label={t("signUp.submit")}
          loading={submitting}
          onPress={submit}
        />
        <Pressable
          onPress={() => router.replace("/sign-in" as RelativePathString)}
          style={authUiStyles.textLink}
        >
          <Text style={authUiStyles.textLinkLabel}>
            {t("signUp.haveAccount")}
          </Text>
        </Pressable>
      </View>
    </AuthScreenShell>
  );
};
