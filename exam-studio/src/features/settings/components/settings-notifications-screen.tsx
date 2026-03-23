import React, { useEffect, useState } from "react";
import { Pressable, Text } from "react-native";
import { useTranslation } from "react-i18next";
import {
  clearAllPracticeReminderNotifications,
  ensureLocalNotificationPermission,
  getLocalNotificationPermissionState,
  type LocalNotificationPermissionState,
  rescheduleAllPracticeReminderNotifications,
} from "@/features/practice/services/practice-reminder-notification.service";
import { useUpdateAppSettingsMutation } from "../hooks/use-update-app-settings-mutation";
import { useAppSettingsQuery } from "../hooks/use-app-settings-query";
import {
  DEFAULT_APP_SETTINGS,
  type PracticeReminderMinutes,
} from "../types/settings.types";
import { REMINDER_MINUTE_OPTIONS } from "../utils/settings-options";
import { OptionRow, SettingsCard, SettingsPage } from "./settings-ui";
import { settingsUiStyles } from "./settings-ui.styles";

export const SettingsNotificationsScreen = () => {
  const { t } = useTranslation("settingsDetail");
  const appSettingsQuery = useAppSettingsQuery();
  const updateSettingsMutation = useUpdateAppSettingsMutation();
  const settings = appSettingsQuery.data ?? DEFAULT_APP_SETTINGS;
  const [notificationPermission, setNotificationPermission] =
    useState<LocalNotificationPermissionState | null>(null);
  const [notificationError, setNotificationError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    void getLocalNotificationPermissionState()
      .then((permissionState) => {
        if (!cancelled) {
          setNotificationPermission(permissionState);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setNotificationPermission(null);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const togglePracticeReminder = async () => {
    if (updateSettingsMutation.isPending) {
      return;
    }

    setNotificationError(null);

    if (settings.practiceReminderEnabled) {
      await clearAllPracticeReminderNotifications().catch(() => undefined);
      await updateSettingsMutation.mutateAsync({ practiceReminderEnabled: false });
      setNotificationPermission(await getLocalNotificationPermissionState());
      return;
    }

    try {
      const permissionState = await ensureLocalNotificationPermission();
      setNotificationPermission(permissionState);

      if (!permissionState.granted) {
        setNotificationError(
          permissionState.canAskAgain
            ? t("notifications.permissionNotGranted")
            : t("notifications.permissionBlocked"),
        );
        return;
      }

      await updateSettingsMutation.mutateAsync({ practiceReminderEnabled: true });
      await rescheduleAllPracticeReminderNotifications(settings.practiceReminderMinutes).catch(
        () => undefined,
      );
    } catch (error) {
      setNotificationError(
        error instanceof Error ? error.message : t("notifications.updateFailed"),
      );
    }
  };

  const updateReminderMinutes = async (value: PracticeReminderMinutes) => {
    if (updateSettingsMutation.isPending) {
      return;
    }

    await updateSettingsMutation.mutateAsync({ practiceReminderMinutes: value });
    if (settings.practiceReminderEnabled) {
      await rescheduleAllPracticeReminderNotifications(value).catch(() => undefined);
    }
  };

  return (
    <SettingsPage
      title={t("notifications.title")}
      subtitle={t("notifications.subtitle")}
      showBack
    >
      <SettingsCard>
        <Text style={settingsUiStyles.cardTitle}>{t("notifications.practiceReminder")}</Text>
        {notificationError ? <Text style={settingsUiStyles.errorText}>{notificationError}</Text> : null}
        <Pressable
          disabled={updateSettingsMutation.isPending}
          style={({ pressed }) => [
            settingsUiStyles.settingRow,
            updateSettingsMutation.isPending && settingsUiStyles.buttonDisabled,
            pressed && !updateSettingsMutation.isPending && settingsUiStyles.buttonPressed,
          ]}
          onPress={() => {
            void togglePracticeReminder();
          }}
        >
          <Text style={settingsUiStyles.settingTitle}>{t("notifications.reminderToggle")}</Text>
          <Text style={settingsUiStyles.settingValue}>
            {settings.practiceReminderEnabled ? t("notifications.on") : t("notifications.off")}
          </Text>
        </Pressable>
        <Text style={settingsUiStyles.metaText}>
          {t("notifications.permission", {
            state: notificationPermission?.granted
              ? t("notifications.granted")
              : t("notifications.notGranted"),
          })}
        </Text>
        <Text style={settingsUiStyles.settingLabel}>{t("notifications.reminderInterval")}</Text>
        <OptionRow
          disabled={updateSettingsMutation.isPending || !settings.practiceReminderEnabled}
          options={REMINDER_MINUTE_OPTIONS}
          selectedValue={settings.practiceReminderMinutes}
          onPress={(value) => {
            void updateReminderMinutes(Number(value) as PracticeReminderMinutes);
          }}
        />
      </SettingsCard>
    </SettingsPage>
  );
};
