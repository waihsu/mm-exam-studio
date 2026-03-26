import { useLocalSearchParams, useRouter, type RelativePathString } from "expo-router";
import React, { useMemo, useState } from "react";
import { Text, View } from "react-native";
import { useTranslation } from "@/i18n";
import { AuthScreenShell } from "./auth-screen-shell";
import { AuthBanner, AuthButton, authUiStyles } from "./auth-ui";
import { useSendVerificationEmailMutation } from "../hooks/use-send-verification-email-mutation";

const readEmailParam = (value: string | string[] | undefined) => {
  if (typeof value === "string") return value.trim();
  if (Array.isArray(value)) return String(value[0] ?? "").trim();
  return "";
};

export const VerifyEmailPendingScreen = () => {
  const router = useRouter();
  const params = useLocalSearchParams<{ email?: string | string[] }>();
  const { t } = useTranslation("auth");
  const resendMutation = useSendVerificationEmailMutation();
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const email = useMemo(() => readEmailParam(params.email), [params.email]);

  const resendEmail = async () => {
    if (!email || resendMutation.isPending) {
      return;
    }

    setFeedbackMessage(null);
    setErrorMessage(null);

    try {
      const result = await resendMutation.mutateAsync({ email });
      setFeedbackMessage(result.message);
    } catch (error) {
      setErrorMessage(
        error instanceof Error && error.message.trim().length > 0
          ? error.message
          : t("verifyEmailPending.resendFailed"),
      );
    }
  };

  return (
    <AuthScreenShell
      accentLabel={t("verifyEmailPending.kicker")}
      subtitle={t("verifyEmailPending.subtitle")}
      title={t("verifyEmailPending.title")}
    >
      <View style={authUiStyles.sectionHeader}>
        <Text style={authUiStyles.sectionKicker}>{t("verifyEmailPending.kicker")}</Text>
        <Text style={authUiStyles.sectionTitle}>{t("verifyEmailPending.sectionTitle")}</Text>
      </View>

      <Text style={authUiStyles.sectionDescription}>
        {t("verifyEmailPending.body", {
          email: email || t("verifyEmailPending.emailFallback"),
        })}
      </Text>

      <AuthBanner message={feedbackMessage} tone="success" />
      <AuthBanner message={errorMessage} tone="error" />

      <View style={authUiStyles.actionStack}>
        <AuthButton
          disabled={!email}
          label={t("verifyEmailPending.resend")}
          loading={resendMutation.isPending}
          variant="secondary"
          onPress={resendEmail}
        />
        <AuthButton
          label={t("verifyEmailPending.backToSignIn")}
          onPress={() => router.replace("/sign-in" as RelativePathString)}
        />
      </View>
    </AuthScreenShell>
  );
};
