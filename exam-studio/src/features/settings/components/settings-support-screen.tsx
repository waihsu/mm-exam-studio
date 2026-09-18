import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { useTranslation } from "react-i18next";
import { useCreateSupportMessageMutation } from "@/features/support/hooks/use-create-support-message-mutation";
import { useMySupportConversationRealtime } from "@/features/support/hooks/use-my-support-conversation-realtime";
import { useMySupportConversationQuery } from "@/features/support/hooks/use-my-support-conversation-query";
import { useRefreshAction } from "@/hooks/use-refresh-action";
import { useAppDateTimeFormatter } from "../hooks/use-app-date-time-formatter";
import { SettingsCard, SettingsPage } from "./settings-ui";
import { settingsUiStyles } from "./settings-ui.styles";

export const SettingsSupportScreen = () => {
  const { t } = useTranslation("settingsDetail");
  const { formatDateTime } = useAppDateTimeFormatter();
  const supportConversationQuery = useMySupportConversationQuery();
  const supportRealtime = useMySupportConversationRealtime();
  const createSupportMessageMutation = useCreateSupportMessageMutation();
  const messageListRef = useRef<ScrollView | null>(null);
  const [messageBody, setMessageBody] = useState("");
  const [messageSubject, setMessageSubject] = useState("");
  const supportTopicPresets = t("support.presets", { returnObjects: true }) as Array<{
    label: string;
    subject: string;
    draft: string;
  }>;
  const supportRefresh = useRefreshAction(async () => {
    await supportConversationQuery.refetch();
  });

  const conversation = supportConversationQuery.data?.conversation ?? null;
  const messages = supportConversationQuery.data?.messages ?? [];
  const canUserReply = conversation?.allowUserReplies ?? true;
  const resolvedSubject = useMemo(
    () => conversation?.subject ?? messageSubject,
    [conversation?.subject, messageSubject],
  );
  const activePreset = useMemo(
    () =>
      supportTopicPresets.find((preset) => preset.subject === resolvedSubject.trim()) ?? null,
    [resolvedSubject, supportTopicPresets],
  );

  useEffect(() => {
    if (!messages.length) {
      return;
    }

    requestAnimationFrame(() => {
      messageListRef.current?.scrollToEnd({ animated: true });
    });
  }, [messages.length]);

  const sendMessage = async () => {
    if (createSupportMessageMutation.isPending) {
      return;
    }

    const trimmedBody = messageBody.trim();
    if (!trimmedBody) {
      return;
    }

    try {
      await createSupportMessageMutation.mutateAsync({
        body: trimmedBody,
        subject: resolvedSubject.trim() || undefined,
      });
      setMessageBody("");
      if (!conversation?.subject) {
        setMessageSubject(resolvedSubject.trim());
      }
    } catch {
      // error is rendered below
    }
  };

  return (
    <SettingsPage
      title={t("support.title")}
      subtitle={t("support.subtitle")}
      showBack
      scrollProps={{
        refreshControl: (
          <RefreshControl
            refreshing={supportRefresh.refreshing}
            onRefresh={() => {
              void supportRefresh.onRefresh();
            }}
          />
        ),
      }}
    >
      <SettingsCard>
        <Text style={settingsUiStyles.cardTitle}>{t("support.quickHelp")}</Text>
        <Text style={settingsUiStyles.metaText}>{t("support.quickHelpBody")}</Text>
      </SettingsCard>

      <SettingsCard>
        <Text style={settingsUiStyles.cardTitle}>{t("support.chat")}</Text>
        {supportConversationQuery.isError ? (
          <Text style={settingsUiStyles.errorText}>
            {supportConversationQuery.error instanceof Error
              ? supportConversationQuery.error.message
              : t("support.supportChatFailed")}
          </Text>
        ) : null}
        {createSupportMessageMutation.isError ? (
          <Text style={settingsUiStyles.errorText}>
            {createSupportMessageMutation.error instanceof Error
              ? createSupportMessageMutation.error.message
              : t("support.supportSendFailed")}
          </Text>
        ) : null}
        <View style={settingsUiStyles.supportStatusRow}>
          <View
            style={[
              settingsUiStyles.supportStatusChip,
              conversation?.status === "closed"
                ? settingsUiStyles.supportStatusChipMuted
                : settingsUiStyles.supportStatusChipOpen,
            ]}
          >
            <Text
              style={[
                settingsUiStyles.supportStatusChipLabel,
                conversation?.status === "closed"
                  ? settingsUiStyles.supportStatusChipLabelMuted
                  : settingsUiStyles.supportStatusChipLabelOpen,
              ]}
            >
              {conversation?.status === "closed" ? t("support.closedThread") : t("support.openThread")}
            </Text>
          </View>
          <View
            style={[
              settingsUiStyles.supportStatusChip,
              canUserReply
                ? settingsUiStyles.supportStatusChipInfo
                : settingsUiStyles.supportStatusChipWarn,
            ]}
          >
            <Text
              style={[
                settingsUiStyles.supportStatusChipLabel,
                canUserReply
                  ? settingsUiStyles.supportStatusChipLabelInfo
                  : settingsUiStyles.supportStatusChipLabelWarn,
              ]}
            >
              {canUserReply ? t("support.repliesEnabled") : t("support.repliesPaused")}
            </Text>
          </View>
          <View
            style={[
              settingsUiStyles.supportStatusChip,
              supportRealtime.status === "live"
                ? settingsUiStyles.supportStatusChipOpen
                : settingsUiStyles.supportStatusChipMuted,
            ]}
          >
            <Text
              style={[
                settingsUiStyles.supportStatusChipLabel,
                supportRealtime.status === "live"
                  ? settingsUiStyles.supportStatusChipLabelOpen
                  : settingsUiStyles.supportStatusChipLabelMuted,
              ]}
            >
              {t("support.syncStatus", { status: supportRealtime.status })}
            </Text>
          </View>
        </View>
        <View style={settingsUiStyles.supportSummaryRow}>
          <Text style={settingsUiStyles.metaText}>
            {conversation?.lastMessageAt
              ? t("support.updatedAt", { date: formatDateTime(conversation.lastMessageAt) })
              : t("support.noMessagesYet")}
          </Text>
          <Text style={settingsUiStyles.supportConversationMeta}>
            {t("support.messageCount", { count: messages.length })}
          </Text>
        </View>
        {supportRealtime.errorMessage ? (
          <Text style={settingsUiStyles.errorText}>{supportRealtime.errorMessage}</Text>
        ) : null}
        {supportRealtime.status !== "live" ? (
          <Text style={settingsUiStyles.metaText}>{t("support.liveOffline")}</Text>
        ) : null}
        {!canUserReply ? (
          <View style={settingsUiStyles.inlineInfoBox}>
            <Text style={settingsUiStyles.inlineInfoTitle}>{t("support.repliesPausedTitle")}</Text>
            <Text style={settingsUiStyles.metaText}>{t("support.repliesPausedBody")}</Text>
          </View>
        ) : null}
        {!conversation?.subject ? (
          <View style={settingsUiStyles.supportPresetGroup}>
            <View style={settingsUiStyles.supportPresetHeader}>
              <Text style={settingsUiStyles.supportComposerTitle}>{t("support.chooseTopic")}</Text>
              <Text style={settingsUiStyles.supportConversationMeta}>{t("support.optional")}</Text>
            </View>
            <View style={settingsUiStyles.optionRow}>
              {supportTopicPresets.map((preset) => {
                const isActive = activePreset?.subject === preset.subject;
                return (
                  <Pressable
                    key={preset.subject}
                    style={[
                      settingsUiStyles.optionChip,
                      isActive && settingsUiStyles.optionChipActive,
                    ]}
                    onPress={() => {
                      setMessageSubject(preset.subject);
                      setMessageBody((current) =>
                        current.trim().length > 0 ? current : preset.draft,
                      );
                    }}
                  >
                    <Text
                      style={[
                        settingsUiStyles.optionChipLabel,
                        isActive && settingsUiStyles.optionChipLabelActive,
                      ]}
                    >
                      {preset.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            <TextInput
              placeholder={t("support.customSubject")}
              placeholderTextColor="#94A3B8"
              style={settingsUiStyles.textInput}
              value={messageSubject}
              onChangeText={setMessageSubject}
            />
          </View>
        ) : (
          <View style={settingsUiStyles.inlineInfoBox}>
            <Text style={settingsUiStyles.inlineInfoTitle}>{t("support.topic")}</Text>
            <Text style={settingsUiStyles.metaText}>{conversation.subject}</Text>
          </View>
        )}
        <View style={settingsUiStyles.supportConversationPanel}>
          <View style={settingsUiStyles.supportConversationHeader}>
            <Text style={settingsUiStyles.supportConversationTitle}>{t("support.messages")}</Text>
            <Text style={settingsUiStyles.supportConversationMeta}>
              {messages.length ? t("support.totalCount", { count: messages.length }) : t("support.startFirstMessage")}
            </Text>
          </View>
          {messages.length === 0 ? (
            <View style={settingsUiStyles.supportEmptyState}>
              <Text style={settingsUiStyles.inlineInfoTitle}>{t("support.emptyTitle")}</Text>
              <Text style={settingsUiStyles.metaText}>{t("support.emptyBody")}</Text>
            </View>
          ) : (
            <ScrollView
              ref={messageListRef}
              nestedScrollEnabled
              style={settingsUiStyles.supportMessageList}
              contentContainerStyle={settingsUiStyles.supportMessageListContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              onContentSizeChange={() => {
                messageListRef.current?.scrollToEnd({ animated: true });
              }}
            >
              {messages.map((message) => {
                const isUser = message.senderRole === "user";
                return (
                  <View
                    key={message.id}
                    style={[
                      settingsUiStyles.supportMessageBubble,
                      isUser
                        ? settingsUiStyles.supportMessageBubbleUser
                        : settingsUiStyles.supportMessageBubbleAdmin,
                    ]}
                  >
                    <Text style={settingsUiStyles.supportMessageAuthor}>
                      {isUser ? t("support.you") : message.senderName ?? t("support.admin")}
                    </Text>
                    <Text style={settingsUiStyles.supportMessageBody}>{message.body}</Text>
                    <Text style={settingsUiStyles.supportMessageTime}>
                      {formatDateTime(message.createdAt)}
                    </Text>
                  </View>
                );
              })}
            </ScrollView>
          )}
        </View>
        <View style={settingsUiStyles.supportComposerCard}>
          <View style={settingsUiStyles.supportPresetHeader}>
            <Text style={settingsUiStyles.supportComposerTitle}>{t("support.newMessage")}</Text>
            {resolvedSubject.trim() ? (
              <Text style={settingsUiStyles.supportConversationMeta}>{resolvedSubject.trim()}</Text>
            ) : null}
          </View>
          <TextInput
            multiline
            editable={canUserReply}
            placeholder={
              canUserReply
                ? t("support.describeIssue")
                : t("support.repliesBlockedPlaceholder")
            }
            placeholderTextColor="#94A3B8"
            style={[
              settingsUiStyles.textInput,
              settingsUiStyles.textAreaInput,
              settingsUiStyles.supportComposerInput,
              !canUserReply && settingsUiStyles.inputDisabled,
            ]}
            value={messageBody}
            onChangeText={setMessageBody}
          />
          <View style={settingsUiStyles.optionRow}>
            {supportTopicPresets.map((preset) => (
              <Pressable
                key={preset.label}
                style={settingsUiStyles.optionChip}
                onPress={() => {
                  setMessageSubject(preset.subject);
                  setMessageBody(preset.draft);
                }}
              >
                <Text style={settingsUiStyles.optionChipLabel}>{preset.label}</Text>
              </Pressable>
            ))}
          </View>
          <Pressable
            disabled={createSupportMessageMutation.isPending || !canUserReply}
            style={({ pressed }) => [
              settingsUiStyles.primaryButton,
              (createSupportMessageMutation.isPending || !canUserReply) &&
                settingsUiStyles.buttonDisabled,
              pressed &&
                !createSupportMessageMutation.isPending &&
                canUserReply &&
                settingsUiStyles.buttonPressed,
            ]}
            onPress={() => {
              void sendMessage();
            }}
          >
            <Text style={settingsUiStyles.primaryButtonLabel}>
              {createSupportMessageMutation.isPending
                ? t("support.sending")
                : canUserReply
                  ? t("support.sendMessage")
                  : t("support.repliesBlocked")}
            </Text>
          </Pressable>
        </View>
      </SettingsCard>
    </SettingsPage>
  );
};
