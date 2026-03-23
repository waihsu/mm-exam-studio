import { useRouter, type RelativePathString } from "expo-router";
import React from "react";
import { Text, View } from "react-native";
import { useTranslation } from "@/i18n";
import { AuthScreenShell } from "./auth-screen-shell";
import { AuthButton, authUiStyles } from "./auth-ui";
import { useAuthSessionQuery } from "../hooks/use-auth-session-query";

export const EmailVerifiedScreen = () => {
  const router = useRouter();
  const { t } = useTranslation("auth");
  const sessionQuery = useAuthSessionQuery();

  return (
    <AuthScreenShell
      accentLabel={t("emailVerified.kicker")}
      subtitle={t("emailVerified.subtitle")}
      title={t("emailVerified.title")}
    >
      <View style={authUiStyles.sectionHeader}>
        <Text style={authUiStyles.sectionKicker}>{t("emailVerified.kicker")}</Text>
        <Text style={authUiStyles.sectionTitle}>{t("emailVerified.sectionTitle")}</Text>
      </View>

      <Text style={authUiStyles.sectionDescription}>
        {t("emailVerified.body")}
      </Text>

      <View style={authUiStyles.actionStack}>
        <AuthButton
          label={sessionQuery.data ? t("emailVerified.goHome") : t("emailVerified.goSignIn")}
          onPress={() =>
            router.replace(
              sessionQuery.data
                ? ("/home" as RelativePathString)
                : ("/sign-in" as RelativePathString),
            )
          }
        />
      </View>
    </AuthScreenShell>
  );
};
