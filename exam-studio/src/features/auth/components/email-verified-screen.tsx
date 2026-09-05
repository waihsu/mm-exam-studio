import { useRouter, type RelativePathString } from "expo-router";
import React from "react";
import { Text, View } from "react-native";
import { useTranslation } from "@/i18n";
import { AuthScreenShell } from "./auth-screen-shell";
import { AuthButton } from "./auth-ui";
import { authUiStyles } from "./auth-ui.styles";

export const EmailVerifiedScreen = () => {
  const router = useRouter();
  const { t } = useTranslation("auth");

  return (
    <AuthScreenShell
      accentLabel={t("emailVerified.kicker")}
      subtitle={t("emailVerified.subtitle")}
      title={t("emailVerified.title")}
    >
      <View style={authUiStyles.sectionHeader}>
        <Text style={authUiStyles.sectionKicker}>
          {t("emailVerified.kicker")}
        </Text>
        <Text style={authUiStyles.sectionTitle}>
          {t("emailVerified.sectionTitle")}
        </Text>
      </View>

      <Text style={authUiStyles.sectionDescription}>
        {t("emailVerified.body")}
      </Text>

      <View style={authUiStyles.actionStack}>
        <AuthButton
          label={t("emailVerified.goSignIn")}
          onPress={() => router.replace("/sign-in" as RelativePathString)}
        />
      </View>
    </AuthScreenShell>
  );
};
