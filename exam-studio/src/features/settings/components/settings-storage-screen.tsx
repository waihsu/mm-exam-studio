import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import React from "react";
import { Pressable, Text } from "react-native";
import { useTranslation } from "react-i18next";
import { ConfirmationSheet } from "@/components/ui/confirmation-sheet";
import {
  clearAllPracticeDrafts,
  getStoredPracticeDraftCount,
} from "@/features/practice/services/practice-draft-store";
import { API_BASE_URL } from "@/lib/config";
import { SETTINGS_QUERY_KEYS } from "../constants/query-keys";
import { SettingsCard, SettingsPage } from "./settings-ui";
import { settingsUiStyles } from "./settings-ui.styles";

export const SettingsStorageScreen = () => {
  const { t } = useTranslation("settingsDetail");
  const queryClient = useQueryClient();
  const [confirmClearOpen, setConfirmClearOpen] = React.useState(false);
  const draftsQuery = useQuery({
    queryKey: SETTINGS_QUERY_KEYS.practiceDrafts,
    queryFn: getStoredPracticeDraftCount,
    staleTime: 0,
  });

  const clearDraftsMutation = useMutation({
    mutationFn: clearAllPracticeDrafts,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: SETTINGS_QUERY_KEYS.practiceDrafts });
    },
  });

  const clearDrafts = () => {
    if (clearDraftsMutation.isPending) {
      return;
    }

    setConfirmClearOpen(true);
  };

  return (
    <SettingsPage
      title={t("storage.title")}
      subtitle={t("storage.subtitle")}
      showBack
    >
      <SettingsCard>
        <Text style={settingsUiStyles.cardTitle}>{t("storage.localData")}</Text>
        <Text style={settingsUiStyles.metaText}>{t("storage.draftsSaved", { count: draftsQuery.data ?? 0 })}</Text>
        {clearDraftsMutation.isError ? (
          <Text style={settingsUiStyles.errorText}>
            {clearDraftsMutation.error instanceof Error
              ? clearDraftsMutation.error.message
              : t("storage.clearFailed")}
          </Text>
        ) : null}
        <Pressable
          disabled={clearDraftsMutation.isPending}
          style={({ pressed }) => [
            settingsUiStyles.dangerButton,
            clearDraftsMutation.isPending && settingsUiStyles.buttonDisabled,
            pressed && !clearDraftsMutation.isPending && settingsUiStyles.buttonPressed,
          ]}
          onPress={clearDrafts}
        >
          <Text style={settingsUiStyles.dangerButtonLabel}>
            {clearDraftsMutation.isPending ? t("storage.clearing") : t("storage.clearDrafts")}
          </Text>
        </Pressable>
      </SettingsCard>

      {__DEV__ ? (
        <SettingsCard>
          <Text style={settingsUiStyles.cardTitle}>{t("storage.app")}</Text>
          <Text style={settingsUiStyles.metaText}>API Base URL: {API_BASE_URL}</Text>
        </SettingsCard>
      ) : null}

      <ConfirmationSheet
        visible={confirmClearOpen}
        title={t("storage.clearTitle")}
        message={t("storage.clearMessage")}
        hint={t("storage.clearHint")}
        confirmLabel={t("storage.clearDrafts")}
        confirmTone="danger"
        isPending={clearDraftsMutation.isPending}
        onClose={() => setConfirmClearOpen(false)}
        onConfirm={() => {
          void clearDraftsMutation.mutateAsync().catch(() => undefined);
          setConfirmClearOpen(false);
        }}
      />
    </SettingsPage>
  );
};
