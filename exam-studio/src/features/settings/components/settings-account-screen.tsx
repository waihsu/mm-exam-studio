import { useRouter, type RelativePathString } from "expo-router";
import React from "react";
import { ActivityIndicator, Pressable, RefreshControl, Text } from "react-native";
import { useTranslation } from "react-i18next";
import { useAuthSessionQuery } from "@/features/auth/hooks/use-auth-session-query";
import { useSendVerificationEmailMutation } from "@/features/auth/hooks/use-send-verification-email-mutation";
import { useSignOutMutation } from "@/features/auth/hooks/use-sign-out-mutation";
import { clearAllPracticeReminderNotifications } from "@/features/practice/services/practice-reminder-notification.service";
import { useRefreshAction } from "@/hooks/use-refresh-action";
import { SettingsCard, SettingsLoadingRow, SettingsPage } from "./settings-ui";
import { settingsUiStyles } from "./settings-ui.styles";

export const SettingsAccountScreen = () => {
  const { t } = useTranslation("settingsDetail");
  const router = useRouter();
  const authSessionQuery = useAuthSessionQuery();
  const sendVerificationMutation = useSendVerificationEmailMutation();
  const signOutMutation = useSignOutMutation();
  const user = authSessionQuery.data?.user;
  const accountRefresh = useRefreshAction(async () => {
    await authSessionQuery.refetch();
  });

  const signOut = async () => {
    if (signOutMutation.isPending) {
      return;
    }

    try {
      await clearAllPracticeReminderNotifications().catch(() => undefined);
      await signOutMutation.mutateAsync();
      router.replace("/sign-in" as RelativePathString);
    } catch {
      // no-op: error state rendered below
    }
  };

  const resendVerification = async () => {
    if (!user?.email || user.emailVerified || sendVerificationMutation.isPending) {
      return;
    }

    try {
      await sendVerificationMutation.mutateAsync({
        email: user.email,
      });
    } catch {
      // no-op: error state rendered below
    }
  };

  return (
    <SettingsPage
      title={t("account.title")}
      subtitle={t("account.subtitle")}
      showBack
      scrollProps={{
        refreshControl: (
          <RefreshControl
            refreshing={accountRefresh.refreshing}
            onRefresh={() => {
              void accountRefresh.onRefresh();
            }}
          />
        ),
      }}
    >
      <SettingsCard>
        <Text style={settingsUiStyles.cardTitle}>{t("account.profile")}</Text>
        {authSessionQuery.isLoading ? <SettingsLoadingRow label={t("account.loading")} /> : null}
        {authSessionQuery.isError ? (
          <Text style={settingsUiStyles.errorText}>
            {authSessionQuery.error instanceof Error
              ? authSessionQuery.error.message
              : t("account.failed")}
          </Text>
        ) : null}
        {user ? (
          <>
            <Text style={settingsUiStyles.metaText}>{t("account.name")}: {user.name || "-"}</Text>
            <Text style={settingsUiStyles.metaText}>{t("account.email")}: {user.email}</Text>
            <Text style={settingsUiStyles.metaText}>
              {t("account.emailVerified")}: {user.emailVerified ? t("account.yes") : t("account.no")}
            </Text>
            <Text style={settingsUiStyles.metaText}>{t("account.userId")}: {user.id}</Text>
          </>
        ) : null}
      </SettingsCard>

      {user && !user.emailVerified ? (
        <SettingsCard>
          <Text style={settingsUiStyles.cardTitle}>{t("account.verificationTitle")}</Text>
          <Text style={settingsUiStyles.metaText}>{t("account.verificationHint")}</Text>
          {sendVerificationMutation.isError ? (
            <Text style={settingsUiStyles.errorText}>
              {sendVerificationMutation.error instanceof Error
                ? sendVerificationMutation.error.message
                : t("account.verificationFailed")}
            </Text>
          ) : null}
          {sendVerificationMutation.isSuccess ? (
            <Text style={settingsUiStyles.successText}>
              {sendVerificationMutation.data.message}
            </Text>
          ) : null}
          <Pressable
            disabled={sendVerificationMutation.isPending}
            style={({ pressed }) => [
              settingsUiStyles.secondaryButton,
              sendVerificationMutation.isPending && settingsUiStyles.buttonDisabled,
              pressed &&
                !sendVerificationMutation.isPending &&
                settingsUiStyles.buttonPressed,
            ]}
            onPress={() => {
              void resendVerification();
            }}
          >
            {sendVerificationMutation.isPending ? (
              <ActivityIndicator color="#0F172A" />
            ) : (
              <Text style={settingsUiStyles.secondaryButtonLabel}>{t("account.sendVerification")}</Text>
            )}
          </Pressable>
        </SettingsCard>
      ) : null}

      <SettingsCard>
        <Text style={settingsUiStyles.cardTitle}>{t("account.session")}</Text>
        {signOutMutation.isError ? (
          <Text style={settingsUiStyles.errorText}>
            {signOutMutation.error instanceof Error
              ? signOutMutation.error.message
              : t("account.signOutFailed")}
          </Text>
        ) : null}
        <Pressable
          disabled={signOutMutation.isPending}
          style={({ pressed }) => [
            settingsUiStyles.primaryButton,
            signOutMutation.isPending && settingsUiStyles.buttonDisabled,
            pressed && !signOutMutation.isPending && settingsUiStyles.buttonPressed,
          ]}
          onPress={() => {
            void signOut();
          }}
        >
          {signOutMutation.isPending ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={settingsUiStyles.primaryButtonLabel}>{t("account.signOut")}</Text>
          )}
        </Pressable>
      </SettingsCard>
    </SettingsPage>
  );
};
