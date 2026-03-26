import React, { useState } from "react";
import { Pressable, RefreshControl, Text, TextInput, View } from "react-native";
import { useTranslation } from "react-i18next";
import { ConfirmationSheet } from "@/components/ui/confirmation-sheet";
import { useChangePasswordMutation } from "@/features/auth/hooks/use-change-password-mutation";
import { useAuthDeviceSessionsQuery } from "@/features/auth/hooks/use-auth-device-sessions-query";
import { useAuthSessionQuery } from "@/features/auth/hooks/use-auth-session-query";
import { useRevokeOtherSessionsMutation } from "@/features/auth/hooks/use-revoke-other-sessions-mutation";
import { useRevokeSessionMutation } from "@/features/auth/hooks/use-revoke-session-mutation";
import { useRefreshAction } from "@/hooks/use-refresh-action";
import { useAppSettingsQuery } from "../hooks/use-app-settings-query";
import { DEFAULT_APP_SETTINGS } from "../types/settings.types";
import { formatDateTimeWithSettings } from "../utils/date-time-format";
import { SettingsCard, SettingsLoadingRow, SettingsPage } from "./settings-ui";
import { settingsUiStyles } from "./settings-ui.styles";

const formatSessionDeviceLabel = (
  rawDevice: string,
  bucket: "mobile" | "desktop",
  t: (key: string) => string,
) => {
  const normalized = rawDevice.trim();
  if (!normalized) {
    return bucket === "mobile" ? t("security.mobileApp") : t("security.desktopBrowser");
  }

  if (/okhttp/i.test(normalized)) {
    return t("security.mobileApp");
  }

  if (/cfnetwork|darwin/i.test(normalized)) {
    return t("security.iosApp");
  }

  return normalized;
};

export const SettingsSecurityScreen = () => {
  const { t } = useTranslation("settingsDetail");
  const authSessionQuery = useAuthSessionQuery();
  const deviceSessionsQuery = useAuthDeviceSessionsQuery(Boolean(authSessionQuery.data));
  const revokeOtherSessionsMutation = useRevokeOtherSessionsMutation();
  const revokeSessionMutation = useRevokeSessionMutation();
  const changePasswordMutation = useChangePasswordMutation();
  const appSettingsQuery = useAppSettingsQuery();
  const settings = appSettingsQuery.data ?? DEFAULT_APP_SETTINGS;
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<
    | { kind: "revoke-others" }
    | { kind: "revoke-session"; sessionId: string }
    | null
  >(null);
  const securityRefresh = useRefreshAction(async () => {
    await deviceSessionsQuery.refetch();
  });

  const formatDateTime = (value: string | null) => formatDateTimeWithSettings(value, settings);

  const submitPasswordChange = async () => {
    if (changePasswordMutation.isPending) {
      return;
    }

    setMessage(null);

    if (!currentPassword.trim() || !newPassword.trim() || !confirmNewPassword.trim()) {
      setMessage(t("security.fillAllFields"));
      return;
    }

    if (newPassword.length < 8) {
      setMessage(t("security.passwordTooShort"));
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setMessage(t("security.passwordMismatch"));
      return;
    }

    if (currentPassword === newPassword) {
      setMessage(t("security.passwordSame"));
      return;
    }

    try {
      const result = await changePasswordMutation.mutateAsync({
        currentPassword,
        newPassword,
      });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
      setMessage(
        result.revokedCount > 0
          ? t("security.passwordUpdatedWithRevoked", { count: result.revokedCount })
          : t("security.passwordUpdated"),
      );
    } catch (error) {
      setMessage(error instanceof Error ? error.message : t("security.passwordUpdateFailed"));
    }
  };

  const revokeOtherSessions = () => {
    if (revokeOtherSessionsMutation.isPending) {
      return;
    }

    setConfirmAction({ kind: "revoke-others" });
  };

  const revokeSession = (sessionId: string) => {
    if (revokeSessionMutation.isPending) {
      return;
    }

    setConfirmAction({ kind: "revoke-session", sessionId });
  };

  const confirmSecurityAction = async () => {
    if (!confirmAction) {
      return;
    }

    try {
      if (confirmAction.kind === "revoke-others") {
        await revokeOtherSessionsMutation.mutateAsync();
      } else {
        await revokeSessionMutation.mutateAsync(confirmAction.sessionId);
      }
    } catch {
      // no-op: error state rendered below
    } finally {
      setConfirmAction(null);
    }
  };

  return (
    <SettingsPage
      title={t("security.title")}
      subtitle={t("security.subtitle")}
      showBack
      scrollProps={{
        refreshControl: (
          <RefreshControl
            refreshing={securityRefresh.refreshing}
            onRefresh={() => {
              void securityRefresh.onRefresh();
            }}
          />
        ),
      }}
    >
      <SettingsCard>
        <Text style={settingsUiStyles.cardTitle}>{t("security.changePassword")}</Text>
        {message ? (
          <Text
            style={
              message.toLowerCase().includes("failed") || message.toLowerCase().includes("must")
                ? settingsUiStyles.errorText
                : settingsUiStyles.successText
            }
          >
            {message}
          </Text>
        ) : null}
        <TextInput
          autoCapitalize="none"
          editable={!changePasswordMutation.isPending}
          placeholder={t("security.currentPassword")}
          placeholderTextColor="#94A3B8"
          secureTextEntry
          style={settingsUiStyles.textInput}
          value={currentPassword}
          onChangeText={setCurrentPassword}
        />
        <TextInput
          autoCapitalize="none"
          editable={!changePasswordMutation.isPending}
          placeholder={t("security.newPassword")}
          placeholderTextColor="#94A3B8"
          secureTextEntry
          style={settingsUiStyles.textInput}
          value={newPassword}
          onChangeText={setNewPassword}
        />
        <TextInput
          autoCapitalize="none"
          editable={!changePasswordMutation.isPending}
          placeholder={t("security.confirmNewPassword")}
          placeholderTextColor="#94A3B8"
          secureTextEntry
          style={settingsUiStyles.textInput}
          value={confirmNewPassword}
          onChangeText={setConfirmNewPassword}
        />
        <Pressable
          disabled={changePasswordMutation.isPending}
          style={({ pressed }) => [
            settingsUiStyles.secondaryButton,
            changePasswordMutation.isPending && settingsUiStyles.buttonDisabled,
            pressed && !changePasswordMutation.isPending && settingsUiStyles.buttonPressed,
          ]}
          onPress={() => {
            void submitPasswordChange();
          }}
        >
          <Text style={settingsUiStyles.secondaryButtonLabel}>
            {changePasswordMutation.isPending ? t("security.updating") : t("security.updatePassword")}
          </Text>
        </Pressable>
      </SettingsCard>

      <SettingsCard>
        <Text style={settingsUiStyles.cardTitle}>{t("security.activeSessions")}</Text>
        {deviceSessionsQuery.isLoading ? <SettingsLoadingRow label={t("security.loadingSessions")} /> : null}
        {deviceSessionsQuery.isError ? (
          <Text style={settingsUiStyles.errorText}>
            {deviceSessionsQuery.error instanceof Error
              ? deviceSessionsQuery.error.message
              : t("security.failedSessions")}
          </Text>
        ) : null}
        {revokeOtherSessionsMutation.isError ? (
          <Text style={settingsUiStyles.errorText}>
            {revokeOtherSessionsMutation.error instanceof Error
              ? revokeOtherSessionsMutation.error.message
              : t("security.failedRevokeSessions")}
          </Text>
        ) : null}
        {revokeSessionMutation.isError ? (
          <Text style={settingsUiStyles.errorText}>
            {revokeSessionMutation.error instanceof Error
              ? revokeSessionMutation.error.message
              : t("security.failedRevokeSession")}
          </Text>
        ) : null}
        <Pressable
          disabled={revokeOtherSessionsMutation.isPending || !deviceSessionsQuery.data}
          style={({ pressed }) => [
            settingsUiStyles.secondaryButton,
            (revokeOtherSessionsMutation.isPending || !deviceSessionsQuery.data) &&
              settingsUiStyles.buttonDisabled,
            pressed && deviceSessionsQuery.data && settingsUiStyles.buttonPressed,
          ]}
          onPress={revokeOtherSessions}
        >
          <Text style={settingsUiStyles.secondaryButtonLabel}>{t("security.signOutOtherDevices")}</Text>
        </Pressable>

        {deviceSessionsQuery.data?.sessions.map((session) => {
          const isCurrent = session.id === deviceSessionsQuery.data?.currentSessionId;
          const deviceLabel = formatSessionDeviceLabel(
            session.device,
            session.bucket,
            t as (key: string) => string,
          );
          return (
            <View key={session.id} style={settingsUiStyles.sessionCard}>
              <View style={settingsUiStyles.sessionCardHeader}>
                <Text style={settingsUiStyles.sessionDeviceLabel}>
                  {deviceLabel} {isCurrent ? t("security.currentTag") : ""}
                </Text>
                <Text style={settingsUiStyles.sessionBucket}>
                  {session.bucket === "mobile"
                    ? t("security.mobileBucket")
                    : t("security.desktopBucket")}
                </Text>
              </View>
              <Text style={settingsUiStyles.sessionMeta}>
                {t("security.started", { date: formatDateTime(session.createdAt) })}
              </Text>
              <Text style={settingsUiStyles.sessionMeta}>
                {t("security.expires", { date: formatDateTime(session.expiresAt) })}
              </Text>
              <Text style={settingsUiStyles.sessionMeta}>
                {t("security.devicePolicy", {
                  state: session.allowed ? t("security.allowed") : t("security.limited"),
                })}
              </Text>
              {!isCurrent ? (
                <Pressable
                  disabled={revokeSessionMutation.isPending}
                  style={({ pressed }) => [
                    settingsUiStyles.dangerButton,
                    revokeSessionMutation.isPending && settingsUiStyles.buttonDisabled,
                    pressed && !revokeSessionMutation.isPending && settingsUiStyles.buttonPressed,
                  ]}
                  onPress={() => revokeSession(session.id)}
                >
                  <Text style={settingsUiStyles.dangerButtonLabel}>{t("security.revokeSession")}</Text>
                </Pressable>
              ) : null}
            </View>
          );
        })}
      </SettingsCard>

      <ConfirmationSheet
        visible={Boolean(confirmAction)}
        title={
          confirmAction?.kind === "revoke-others"
            ? t("security.confirmRevokeOthersTitle")
            : t("security.confirmRevokeSessionTitle")
        }
        message={
          confirmAction?.kind === "revoke-others"
            ? t("security.confirmRevokeOthersMessage")
            : t("security.confirmRevokeSessionMessage")
        }
        hint={t("security.confirmHint")}
        confirmLabel={
          confirmAction?.kind === "revoke-others"
            ? t("security.confirmRevokeOthers")
            : t("security.confirmRevoke")
        }
        confirmTone="danger"
        isPending={
          revokeOtherSessionsMutation.isPending || revokeSessionMutation.isPending
        }
        onClose={() => setConfirmAction(null)}
        onConfirm={() => {
          void confirmSecurityAction();
        }}
      />
    </SettingsPage>
  );
};
