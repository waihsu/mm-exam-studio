import React, { useEffect, useState } from "react";
import {
  Animated,
  Easing,
  Linking,
  Modal,
  Pressable,
  RefreshControl,
  Text,
  TextInput,
  View,
} from "react-native";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { useTranslation } from "react-i18next";
import { ConfirmationSheet } from "@/components/ui/confirmation-sheet";
import { MiniHelpHint } from "@/components/ui/mini-help-hint";
import { useAuthSessionQuery } from "@/features/auth/hooks/use-auth-session-query";
import { useCancelSubscriptionRequestMutation } from "@/features/subscriptions/hooks/use-cancel-subscription-request-mutation";
import { useCreateSubscriptionRequestMutation } from "@/features/subscriptions/hooks/use-create-subscription-request-mutation";
import { useCurrentSubscriptionRequestQuery } from "@/features/subscriptions/hooks/use-current-subscription-request-query";
import { useOwnSubscriptionRequestsQuery } from "@/features/subscriptions/hooks/use-own-subscription-requests-query";
import { useSubscriptionPaymentConfigQuery } from "@/features/subscriptions/hooks/use-subscription-payment-config-query";
import { useSubscriptionPlansQuery } from "@/features/subscriptions/hooks/use-subscription-plans-query";
import type { SubscriptionPlanCode } from "@/features/subscriptions/types/subscription.types";
import { useRefreshAction } from "@/hooks/use-refresh-action";
import { useWorkspaceSummaryQuery } from "@/features/workspace/hooks/use-workspace-summary-query";
import { useAppSettingsQuery } from "../hooks/use-app-settings-query";
import { DEFAULT_APP_SETTINGS } from "../types/settings.types";
import { formatDateTimeWithSettings } from "../utils/date-time-format";
import {
  formatPlanCode,
  formatRequestStatus,
  formatSubscriptionLimit,
  getPlanFeatureRows,
} from "../utils/subscription-display";
import { OptionRow, SettingsCard, SettingsLoadingRow, SettingsPage } from "./settings-ui";
import { settingsUiStyles } from "./settings-ui.styles";

type SubscriptionJourneyStepTone = "done" | "current" | "upcoming";

export const SettingsSubscriptionScreen = () => {
  const { t } = useTranslation("settingsDetail");
  const authSessionQuery = useAuthSessionQuery();
  const workspaceSummaryQuery = useWorkspaceSummaryQuery(Boolean(authSessionQuery.data));
  const subscriptionPlansQuery = useSubscriptionPlansQuery(Boolean(authSessionQuery.data));
  const currentSubscriptionRequestQuery = useCurrentSubscriptionRequestQuery(Boolean(authSessionQuery.data));
  const ownSubscriptionRequestsQuery = useOwnSubscriptionRequestsQuery(Boolean(authSessionQuery.data));
  const paymentConfigQuery = useSubscriptionPaymentConfigQuery(Boolean(authSessionQuery.data));
  const createSubscriptionRequestMutation = useCreateSubscriptionRequestMutation();
  const cancelSubscriptionRequestMutation = useCancelSubscriptionRequestMutation();
  const appSettingsQuery = useAppSettingsQuery();
  const settings = appSettingsQuery.data ?? DEFAULT_APP_SETTINGS;
  const paymentConfig = paymentConfigQuery.data;
  const currentSubscription = workspaceSummaryQuery.data?.subscription;
  const currentPlanCode = currentSubscription?.code;
  const latestSubscriptionRequest =
    currentSubscriptionRequestQuery.data ?? currentSubscription?.latestRequest ?? null;
  const subscriptionPlans = subscriptionPlansQuery.data ?? [];
  const availableUpgradePlans = subscriptionPlans.filter(
    (plan) =>
      (plan.code === "pro" || plan.code === "premium") && plan.code !== currentPlanCode,
  );
  const availablePlanCatalog = subscriptionPlans.filter(
    (plan) => plan.code === "free" || plan.code === "pro" || plan.code === "premium",
  );
  const recentSubscriptionRequests = ownSubscriptionRequestsQuery.data?.rows.slice(0, 4) ?? [];
  const olderSubscriptionRequests = recentSubscriptionRequests.filter(
    (request) => request.id !== latestSubscriptionRequest?.id,
  );
  const isPremiumPlan = currentSubscription?.code === "premium";
  const hasPendingUpgradeRequest = latestSubscriptionRequest?.status === "pending";
  const canRequestUpgrade =
    !isPremiumPlan && !hasPendingUpgradeRequest && availableUpgradePlans.length > 0;
  const [requestedPlanCode, setRequestedPlanCode] =
    useState<Extract<SubscriptionPlanCode, "pro" | "premium">>("pro");
  const selectedUpgradePlan =
    availablePlanCatalog.find((plan) => plan.code === requestedPlanCode) ?? null;
  const [transactionId, setTransactionId] = useState("");
  const [subscriptionNote, setSubscriptionNote] = useState("");
  const [subscriptionMessage, setSubscriptionMessage] = useState<string | null>(null);
  const [paymentProofDataUrl, setPaymentProofDataUrl] = useState<string | null>(null);
  const [paymentProofPreviewUri, setPaymentProofPreviewUri] = useState<string | null>(null);
  const [isPickingPaymentProof, setIsPickingPaymentProof] = useState(false);
  const [fullscreenProofUri, setFullscreenProofUri] = useState<string | null>(null);
  const [pendingCancelRequestId, setPendingCancelRequestId] = useState<string | null>(null);
  const currentPlanPulse = useState(() => new Animated.Value(1))[0];
  const subscriptionRefresh = useRefreshAction(async () => {
    await Promise.allSettled([
      workspaceSummaryQuery.refetch(),
      currentSubscriptionRequestQuery.refetch(),
      ownSubscriptionRequestsQuery.refetch(),
    ]);
  });

  const formatDateTime = (value: string | null) => formatDateTimeWithSettings(value, settings);
  const formatFileSize = (bytes: number) =>
    bytes >= 1_000_000
      ? `${(bytes / 1_000_000).toFixed(1)} MB`
      : `${Math.max(1, Math.round(bytes / 1_000))} KB`;
  const estimateBase64Bytes = (base64: string) => {
    const padding = base64.endsWith("==") ? 2 : base64.endsWith("=") ? 1 : 0;
    return Math.max(0, Math.floor((base64.length * 3) / 4) - padding);
  };

  const renderPaymentProofPreview = (imageSource: string | null | undefined) => {
    if (!imageSource) {
      return null;
    }

    return (
      <Pressable
        accessibilityRole="button"
        style={settingsUiStyles.proofPreviewPressable}
        onPress={() => setFullscreenProofUri(imageSource)}
      >
        <Image source={imageSource} style={settingsUiStyles.proofPreviewImage} contentFit="cover" />
        <View style={settingsUiStyles.proofPreviewCaptionRow}>
          <Text style={settingsUiStyles.proofPreviewCaption}>{t("subscription.tapToPreview")}</Text>
          <Text style={settingsUiStyles.proofPreviewCaptionAction}>{t("subscription.open")}</Text>
        </View>
      </Pressable>
    );
  };

  const activeJourneyStep = (() => {
    if (isPremiumPlan || latestSubscriptionRequest?.status === "approved") {
      return 3;
    }
    if (latestSubscriptionRequest?.status === "pending") {
      return 2;
    }
    if (latestSubscriptionRequest?.status === "rejected" || latestSubscriptionRequest?.status === "canceled") {
      return 1;
    }
    return 0;
  })();

  const journeySteps = [
    {
      key: "pay",
      label: t("subscription.stepPay"),
      detail: paymentConfig?.channelName ?? t("subscription.paymentChannel"),
    },
    {
      key: "submit",
      label: t("subscription.stepSubmit"),
      detail: selectedUpgradePlan?.name ?? t("subscription.upgradeRequest"),
    },
    {
      key: "waiting",
      label: t("subscription.stepWaiting"),
      detail: t("subscription.adminReview"),
    },
    {
      key: "approved",
      label: t("subscription.stepApproved"),
      detail: t("subscription.planActivated"),
    },
  ] as const;

  const getJourneyTone = (index: number): SubscriptionJourneyStepTone => {
    if (index < activeJourneyStep) {
      return "done";
    }
    if (index === activeJourneyStep) {
      return "current";
    }
    return "upcoming";
  };

  const journeyHeadline = (() => {
    if (isPremiumPlan) {
      return t("subscription.premiumActiveHeadline");
    }
    if (latestSubscriptionRequest?.status === "approved") {
      return t("subscription.approvedHeadline", {
        plan: formatPlanCode(latestSubscriptionRequest.requestedPlanCode),
      });
    }
    if (latestSubscriptionRequest?.status === "pending") {
      return t("subscription.waitingHeadline", {
        plan: formatPlanCode(latestSubscriptionRequest.requestedPlanCode),
      });
    }
    if (latestSubscriptionRequest?.status === "rejected") {
      return t("subscription.rejectedHeadline");
    }
    if (latestSubscriptionRequest?.status === "canceled") {
      return t("subscription.canceledHeadline");
    }
    return t("subscription.readyHeadline", {
      plan: selectedUpgradePlan?.name ?? formatPlanCode(requestedPlanCode),
    });
  })();

  const journeyHint = (() => {
    if (isPremiumPlan) {
      return t("subscription.premiumActiveHint");
    }
    if (latestSubscriptionRequest?.status === "approved") {
      return t("subscription.approvedHint");
    }
    if (latestSubscriptionRequest?.status === "pending") {
      return t("subscription.waitingHint");
    }
    if (latestSubscriptionRequest?.status === "rejected") {
      return t("subscription.rejectedHint");
    }
    if (latestSubscriptionRequest?.status === "canceled") {
      return t("subscription.canceledHint");
    }
    return t("subscription.readyHint");
  })();
  const shouldHighlightCurrentPlan =
    latestSubscriptionRequest?.status === "approved" ||
    (isPremiumPlan && latestSubscriptionRequest?.status !== "pending");

  useEffect(() => {
    if (!currentPlanCode) {
      return;
    }

    if (currentPlanCode === "pro") {
      setRequestedPlanCode("premium");
      return;
    }

    setRequestedPlanCode("pro");
  }, [currentPlanCode]);

  useEffect(() => {
    if (!shouldHighlightCurrentPlan) {
      currentPlanPulse.stopAnimation();
      currentPlanPulse.setValue(1);
      return;
    }

    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(currentPlanPulse, {
          toValue: 1.018,
          duration: 900,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(currentPlanPulse, {
          toValue: 1,
          duration: 900,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    );

    animation.start();
    return () => {
      animation.stop();
      currentPlanPulse.stopAnimation();
      currentPlanPulse.setValue(1);
    };
  }, [currentPlanPulse, shouldHighlightCurrentPlan]);

  const submitSubscriptionRequest = async () => {
    if (createSubscriptionRequestMutation.isPending) {
      return;
    }

    setSubscriptionMessage(null);

    if (!transactionId.trim()) {
      setSubscriptionMessage(t("subscription.transactionRequired"));
      return;
    }

    if (currentSubscription?.code === requestedPlanCode) {
      setSubscriptionMessage(t("subscription.planAlreadyActive"));
      return;
    }

    try {
      await createSubscriptionRequestMutation.mutateAsync({
        planCode: requestedPlanCode,
        transactionId: transactionId.trim(),
        paymentProofImageDataUrl: paymentProofDataUrl ?? undefined,
        note: subscriptionNote.trim() || undefined,
      });
      setTransactionId("");
      setSubscriptionNote("");
      setPaymentProofDataUrl(null);
      setPaymentProofPreviewUri(null);
      setSubscriptionMessage(t("subscription.requestSubmitted"));
    } catch (error) {
      setSubscriptionMessage(
        error instanceof Error ? error.message : t("subscription.submitFailed"),
      );
    }
  };

  const cancelSubscriptionRequest = (requestId: string) => {
    if (cancelSubscriptionRequestMutation.isPending) {
      return;
    }

    setPendingCancelRequestId(requestId);
  };

  const confirmCancelSubscriptionRequest = async () => {
    if (!pendingCancelRequestId) {
      return;
    }

    try {
      await cancelSubscriptionRequestMutation.mutateAsync(pendingCancelRequestId);
      setSubscriptionMessage(t("subscription.canceledSuccess"));
    } catch (error) {
      setSubscriptionMessage(
        error instanceof Error ? error.message : t("subscription.cancelFailed"),
      );
    } finally {
      setPendingCancelRequestId(null);
    }
  };

  const pickPaymentProof = async () => {
    if (isPickingPaymentProof || createSubscriptionRequestMutation.isPending) {
      return;
    }

    setSubscriptionMessage(null);
    setIsPickingPaymentProof(true);

    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        setSubscriptionMessage(t("subscription.libraryPermissionRequired"));
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: true,
        base64: true,
        mediaTypes: ["images"],
        quality: 0.7,
      });

      if (result.canceled || !result.assets?.[0]) {
        return;
      }

      const asset = result.assets[0];
      const maxProofBytes = paymentConfig?.proofImageMaxBytes ?? 1_500_000;
      if (typeof asset.fileSize === "number" && asset.fileSize > maxProofBytes) {
        setSubscriptionMessage(
          t("subscription.imageTooLarge", { size: formatFileSize(maxProofBytes) }),
        );
        return;
      }

      if (!asset.base64) {
        setSubscriptionMessage(t("subscription.imageReadFailed"));
        return;
      }

      const estimatedBytes = estimateBase64Bytes(asset.base64);
      if (estimatedBytes > maxProofBytes) {
        setSubscriptionMessage(
          t("subscription.imageTooLarge", { size: formatFileSize(maxProofBytes) }),
        );
        return;
      }

      const mimeType = asset.mimeType?.startsWith("image/") ? asset.mimeType : "image/jpeg";
      setPaymentProofDataUrl(`data:${mimeType};base64,${asset.base64}`);
      setPaymentProofPreviewUri(asset.uri);
      setSubscriptionMessage(t("subscription.proofAttachedSuccess"));
    } catch (error) {
      setSubscriptionMessage(
        error instanceof Error ? error.message : t("subscription.proofAttachFailed"),
      );
    } finally {
      setIsPickingPaymentProof(false);
    }
  };

  const openExternalUrl = async (url: string | null | undefined, label: string) => {
    if (!url) {
      setSubscriptionMessage(`${label} is not configured yet.`);
      return;
    }

    try {
      const supported = await Linking.canOpenURL(url);
      if (!supported) {
        setSubscriptionMessage(`${label} is not available on this device yet.`);
        return;
      }
      await Linking.openURL(url);
    } catch (error) {
      setSubscriptionMessage(error instanceof Error ? error.message : `Failed to open ${label}.`);
    }
  };

  const renderUpgradeRequestForm = () => {
    if (!canRequestUpgrade) {
      return null;
    }

    return (
      <SettingsCard>
        <Text style={settingsUiStyles.cardTitle}>{t("subscription.submitUpgradeRequest")}</Text>
        <Text style={settingsUiStyles.settingHint}>
          {t("subscription.stepTwoHint")}
        </Text>
        <OptionRow
          disabled={createSubscriptionRequestMutation.isPending}
          options={availableUpgradePlans.map((plan) => ({
            value: plan.code,
            label: plan.name,
          }))}
          selectedValue={requestedPlanCode}
          onPress={(value) =>
            setRequestedPlanCode(value as Extract<SubscriptionPlanCode, "pro" | "premium">)
          }
        />
        <View style={settingsUiStyles.subscriptionSummaryCard}>
          <Text style={settingsUiStyles.settingTitle}>
            {t("subscription.requestTarget", { plan: formatPlanCode(requestedPlanCode) })}
          </Text>
          <Text style={settingsUiStyles.settingHint}>{t("subscription.requestTargetHint")}</Text>
        </View>
        <TextInput
          autoCapitalize="characters"
          editable={!createSubscriptionRequestMutation.isPending}
          placeholder={t("subscription.transactionId")}
          placeholderTextColor="#94A3B8"
          style={settingsUiStyles.textInput}
          value={transactionId}
          onChangeText={setTransactionId}
        />
        <View style={settingsUiStyles.proofUploadCard}>
          <Text style={settingsUiStyles.settingTitle}>{t("subscription.paymentProof")}</Text>
          <Text style={settingsUiStyles.settingHint}>{t("subscription.paymentProofHint")}</Text>
          <Text style={settingsUiStyles.metaText}>
            {t("subscription.maxImageSize", {
              size: formatFileSize(paymentConfig?.proofImageMaxBytes ?? 1_500_000),
            })}
          </Text>
          {paymentProofPreviewUri ? (
            <Pressable
              accessibilityRole="button"
              style={settingsUiStyles.proofPreviewPressable}
              onPress={() => setFullscreenProofUri(paymentProofPreviewUri)}
            >
              <Image
                source={paymentProofPreviewUri}
                style={settingsUiStyles.proofPreviewImage}
                contentFit="cover"
              />
              <View style={settingsUiStyles.proofPreviewCaptionRow}>
                <Text style={settingsUiStyles.proofPreviewCaption}>{t("subscription.tapToPreview")}</Text>
                <Text style={settingsUiStyles.proofPreviewCaptionAction}>{t("subscription.open")}</Text>
              </View>
            </Pressable>
          ) : null}
          <View style={settingsUiStyles.proofActionRow}>
            <Pressable
              disabled={isPickingPaymentProof || createSubscriptionRequestMutation.isPending}
              style={({ pressed }) => [
                settingsUiStyles.secondaryButton,
                (isPickingPaymentProof || createSubscriptionRequestMutation.isPending) &&
                  settingsUiStyles.buttonDisabled,
                pressed &&
                  !isPickingPaymentProof &&
                  !createSubscriptionRequestMutation.isPending &&
                  settingsUiStyles.buttonPressed,
              ]}
              onPress={() => {
                void pickPaymentProof();
              }}
            >
              <Text style={settingsUiStyles.secondaryButtonLabel}>
                {isPickingPaymentProof
                  ? t("subscription.openingLibrary")
                  : paymentProofPreviewUri
                    ? t("subscription.changeImage")
                    : t("subscription.attachImage")}
              </Text>
            </Pressable>
            {paymentProofPreviewUri ? (
              <Pressable
                disabled={createSubscriptionRequestMutation.isPending}
                style={({ pressed }) => [
                  settingsUiStyles.dangerButton,
                  createSubscriptionRequestMutation.isPending && settingsUiStyles.buttonDisabled,
                  pressed &&
                    !createSubscriptionRequestMutation.isPending &&
                    settingsUiStyles.buttonPressed,
                ]}
                onPress={() => {
                  setPaymentProofDataUrl(null);
                  setPaymentProofPreviewUri(null);
                  setSubscriptionMessage(t("subscription.proofRemoved"));
                }}
              >
                <Text style={settingsUiStyles.dangerButtonLabel}>{t("subscription.remove")}</Text>
              </Pressable>
            ) : null}
          </View>
        </View>
        <TextInput
          editable={!createSubscriptionRequestMutation.isPending}
          multiline
          numberOfLines={3}
          placeholder={t("subscription.optionalAdminNote")}
          placeholderTextColor="#94A3B8"
          style={[settingsUiStyles.textInput, settingsUiStyles.textAreaInput]}
          textAlignVertical="top"
          value={subscriptionNote}
          onChangeText={setSubscriptionNote}
        />
        <Pressable
          disabled={createSubscriptionRequestMutation.isPending || availableUpgradePlans.length === 0}
          style={({ pressed }) => [
            settingsUiStyles.primaryButton,
            (createSubscriptionRequestMutation.isPending || availableUpgradePlans.length === 0) &&
              settingsUiStyles.buttonDisabled,
            pressed && !createSubscriptionRequestMutation.isPending && settingsUiStyles.buttonPressed,
          ]}
          onPress={() => {
            void submitSubscriptionRequest();
          }}
        >
          <Text style={settingsUiStyles.primaryButtonLabel}>
            {createSubscriptionRequestMutation.isPending
              ? t("subscription.submitting")
              : t("subscription.requestPlan", { plan: formatPlanCode(requestedPlanCode) })}
          </Text>
        </Pressable>
        <Text style={settingsUiStyles.metaText}>{t("subscription.submitHint")}</Text>
        {createSubscriptionRequestMutation.isError ? (
          <Text style={settingsUiStyles.errorText}>
            {createSubscriptionRequestMutation.error instanceof Error
              ? createSubscriptionRequestMutation.error.message
              : t("subscription.submitFailed")}
          </Text>
        ) : null}
        {subscriptionMessage ? (
          <Text
            style={
              subscriptionMessage.toLowerCase().includes("failed") ||
              subscriptionMessage.toLowerCase().includes("required") ||
              subscriptionMessage.toLowerCase().includes("already")
                ? settingsUiStyles.errorText
                : settingsUiStyles.successText
            }
          >
            {subscriptionMessage}
          </Text>
        ) : null}
      </SettingsCard>
    );
  };

  return (
    <SettingsPage
      title={t("subscription.title")}
      subtitle={t("subscription.subtitle")}
      showBack
      scrollProps={{
        refreshControl: (
          <RefreshControl
            refreshing={subscriptionRefresh.refreshing}
            onRefresh={() => {
              void subscriptionRefresh.onRefresh();
            }}
          />
        ),
      }}
    >
      <SettingsCard>
        <Text style={settingsUiStyles.cardTitle}>{t("subscription.currentPlan")}</Text>
        {workspaceSummaryQuery.isLoading ? <SettingsLoadingRow label={t("subscription.loadingSubscription")} /> : null}
        {workspaceSummaryQuery.isError ? (
          <Text style={settingsUiStyles.errorText}>
            {workspaceSummaryQuery.error instanceof Error
              ? workspaceSummaryQuery.error.message
              : t("subscription.failedSubscription")}
          </Text>
        ) : null}
        {currentSubscription ? (
          <Animated.View
            style={[
              settingsUiStyles.subscriptionSummaryCard,
              shouldHighlightCurrentPlan && settingsUiStyles.subscriptionSummaryCardApproved,
              {
                transform: [{ scale: currentPlanPulse }],
              },
            ]}
          >
            <View style={settingsUiStyles.subscriptionHeaderRow}>
              <View style={settingsUiStyles.subscriptionTitleWrap}>
                <Text style={settingsUiStyles.subscriptionPlanName}>{currentSubscription.name}</Text>
                <Text style={settingsUiStyles.metaText}>
                  {currentSubscription.status} • {currentSubscription.billingCycle}
                </Text>
              </View>
              <Text
                style={[
                  settingsUiStyles.subscriptionStatusPill,
                  currentSubscription.code === "free"
                    ? settingsUiStyles.subscriptionStatusPillFree
                    : currentSubscription.code === "pro"
                      ? settingsUiStyles.subscriptionStatusPillPro
                      : settingsUiStyles.subscriptionStatusPillPremium,
                ]}
              >
                {formatPlanCode(currentSubscription.code)}
              </Text>
            </View>
            {shouldHighlightCurrentPlan ? (
              <View style={settingsUiStyles.subscriptionApprovalBanner}>
                <Text style={settingsUiStyles.subscriptionApprovalBannerLabel}>
                  {latestSubscriptionRequest?.status === "approved"
                    ? t("subscription.approvedActive")
                    : t("subscription.highestActive")}
                </Text>
              </View>
            ) : null}
            <Text style={settingsUiStyles.metaText}>
              {t("subscription.periodEnds", { date: formatDateTime(currentSubscription.currentPeriodEnd) })}
            </Text>
            <Text style={settingsUiStyles.metaText}>
              {t("subscription.pdfExports", {
                used: currentSubscription.usage.pdfExportsUsed,
                remaining: formatSubscriptionLimit(currentSubscription.remaining.pdfExports),
              })}
            </Text>
            <Text style={settingsUiStyles.metaText}>
              {t("subscription.paperGenerations", {
                used: currentSubscription.usage.paperGenerationsUsed,
                remaining: formatSubscriptionLimit(currentSubscription.remaining.paperGenerations),
              })}
            </Text>
            <Text style={settingsUiStyles.metaText}>
              {t("subscription.paperSwaps", {
                used: currentSubscription.usage.paperSwapsUsed,
                remaining: formatSubscriptionLimit(currentSubscription.remaining.paperSwaps),
              })}
            </Text>
            <Text style={settingsUiStyles.metaText}>
              {t("subscription.deviceLimit", {
                deviceLimit: currentSubscription.limits.deviceLimit,
                perPractice: formatSubscriptionLimit(currentSubscription.limits.maxQuestionsPerPractice),
              })}
            </Text>
          </Animated.View>
        ) : null}
      </SettingsCard>

      <SettingsCard>
        <Text style={settingsUiStyles.cardTitle}>{t("subscription.upgradeJourney")}</Text>
        {paymentConfigQuery.isLoading ? <SettingsLoadingRow label={t("subscription.loadingPaymentGuide")} /> : null}
        {paymentConfigQuery.isError ? (
          <Text style={settingsUiStyles.errorText}>
            {paymentConfigQuery.error instanceof Error
              ? paymentConfigQuery.error.message
              : t("subscription.failedPaymentGuide")}
          </Text>
        ) : null}
        <View style={settingsUiStyles.subscriptionJourneySteps}>
          {journeySteps.map((step, index) => {
            const tone = getJourneyTone(index);
            return (
              <View
                key={step.key}
                style={[
                  settingsUiStyles.subscriptionJourneyStep,
                  tone === "done"
                    ? settingsUiStyles.subscriptionJourneyStepDone
                    : tone === "current"
                      ? settingsUiStyles.subscriptionJourneyStepCurrent
                      : settingsUiStyles.subscriptionJourneyStepUpcoming,
                ]}
              >
                <Text
                  style={[
                    settingsUiStyles.subscriptionJourneyStepNumber,
                    tone === "done"
                      ? settingsUiStyles.subscriptionJourneyStepNumberDone
                      : tone === "current"
                        ? settingsUiStyles.subscriptionJourneyStepNumberCurrent
                        : settingsUiStyles.subscriptionJourneyStepNumberUpcoming,
                  ]}
                >
                  {index + 1}
                </Text>
                <View style={settingsUiStyles.subscriptionJourneyStepTextWrap}>
                  <Text style={settingsUiStyles.settingTitle}>{step.label}</Text>
                  <Text style={settingsUiStyles.settingHint}>{step.detail}</Text>
                </View>
              </View>
            );
          })}
        </View>
        <View style={settingsUiStyles.subscriptionSummaryCard}>
          <Text style={settingsUiStyles.settingTitle}>{journeyHeadline}</Text>
          <Text style={settingsUiStyles.settingHint}>{journeyHint}</Text>
          {paymentConfig?.channelName ? (
            <Text style={settingsUiStyles.metaText}>
              {t("subscription.channel", { value: paymentConfig.channelName })}
            </Text>
          ) : null}
          {paymentConfig?.accountName ? (
            <Text style={settingsUiStyles.metaText}>
              {t("subscription.account", { value: paymentConfig.accountName })}
            </Text>
          ) : null}
          {paymentConfig?.accountReference ? (
            <Text style={settingsUiStyles.metaText}>
              {t("subscription.reference", { value: paymentConfig.accountReference })}
            </Text>
          ) : null}
          <Text style={settingsUiStyles.metaText}>
            {t("subscription.proofImageLimit", {
              value: formatFileSize(paymentConfig?.proofImageMaxBytes ?? 1_500_000),
            })}
          </Text>
          <View style={settingsUiStyles.proofActionRow}>
            {paymentConfig?.paymentUrl ? (
              <Pressable
                style={({ pressed }) => [
                  settingsUiStyles.primaryButton,
                  settingsUiStyles.subscriptionActionButton,
                  pressed && settingsUiStyles.buttonPressed,
                ]}
                onPress={() => {
                  void openExternalUrl(paymentConfig.paymentUrl, t("subscription.paymentLink"));
                }}
              >
                <Text style={settingsUiStyles.primaryButtonLabel}>{t("subscription.openPayment")}</Text>
              </Pressable>
            ) : null}
            {paymentConfig?.supportUrl ? (
              <Pressable
                style={({ pressed }) => [
                  settingsUiStyles.secondaryButton,
                  settingsUiStyles.subscriptionActionButton,
                  pressed && settingsUiStyles.buttonPressed,
                ]}
                onPress={() => {
                  void openExternalUrl(paymentConfig.supportUrl, paymentConfig.supportLabel);
                }}
              >
                <Text style={settingsUiStyles.secondaryButtonLabel}>
                  {t("subscription.contactLabel", { label: paymentConfig.supportLabel })}
                </Text>
              </Pressable>
            ) : null}
          </View>
        </View>
        {currentSubscriptionRequestQuery.isLoading ? (
          <SettingsLoadingRow label={t("subscription.latestRequestLoading")} />
        ) : null}
        {currentSubscriptionRequestQuery.isError ? (
          <Text style={settingsUiStyles.errorText}>
            {currentSubscriptionRequestQuery.error instanceof Error
              ? currentSubscriptionRequestQuery.error.message
              : t("subscription.latestRequestFailed")}
          </Text>
        ) : null}
        {latestSubscriptionRequest ? (
          <View style={settingsUiStyles.subscriptionRequestCard}>
            <View style={settingsUiStyles.subscriptionHeaderRow}>
              <View style={settingsUiStyles.subscriptionTitleWrap}>
                <Text style={settingsUiStyles.settingTitle}>
                  {t("subscription.latestRequestTitle", {
                    plan: formatPlanCode(latestSubscriptionRequest.requestedPlanCode),
                  })}
                </Text>
                <Text style={settingsUiStyles.metaText}>
                  {t("subscription.createdMeta", {
                    status: formatRequestStatus(latestSubscriptionRequest.status),
                    date: formatDateTime(latestSubscriptionRequest.createdAt),
                  })}
                </Text>
              </View>
              <Text style={settingsUiStyles.subscriptionRequestStatus}>
                {formatRequestStatus(latestSubscriptionRequest.status)}
              </Text>
            </View>
            {latestSubscriptionRequest.transactionId ? (
              <Text style={settingsUiStyles.metaText}>
                {t("subscription.transaction", { value: latestSubscriptionRequest.transactionId })}
              </Text>
            ) : null}
            <Text style={settingsUiStyles.metaText}>
              {latestSubscriptionRequest.hasPaymentProof
                ? t("subscription.proofAttached")
                : t("subscription.proofNotAttached")}
            </Text>
            {renderPaymentProofPreview(latestSubscriptionRequest.paymentProofImageDataUrl)}
            {latestSubscriptionRequest.note ? (
              <Text style={settingsUiStyles.metaText}>
                {t("subscription.note", { value: latestSubscriptionRequest.note })}
              </Text>
            ) : null}
            {latestSubscriptionRequest.adminNote ? (
              <Text style={settingsUiStyles.metaText}>
                {t("subscription.adminNote", { value: latestSubscriptionRequest.adminNote })}
              </Text>
            ) : null}
            {latestSubscriptionRequest.reviewedAt ? (
              <Text style={settingsUiStyles.metaText}>
                {t("subscription.reviewed", {
                  date: formatDateTime(latestSubscriptionRequest.reviewedAt),
                })}
              </Text>
            ) : null}
            {latestSubscriptionRequest.status === "pending" ? (
              <Pressable
                disabled={cancelSubscriptionRequestMutation.isPending}
                style={({ pressed }) => [
                  settingsUiStyles.secondaryButton,
                  cancelSubscriptionRequestMutation.isPending && settingsUiStyles.buttonDisabled,
                  pressed && !cancelSubscriptionRequestMutation.isPending && settingsUiStyles.buttonPressed,
                ]}
                onPress={() => cancelSubscriptionRequest(latestSubscriptionRequest.id)}
              >
                <Text style={settingsUiStyles.secondaryButtonLabel}>
                  {cancelSubscriptionRequestMutation.isPending
                    ? t("subscription.canceling")
                    : t("subscription.cancelRequest")}
                </Text>
              </Pressable>
            ) : null}
          </View>
        ) : (
          <View style={settingsUiStyles.subscriptionEmptyState}>
            <Text style={settingsUiStyles.metaText}>{t("subscription.noRequestYet")}</Text>
            <MiniHelpHint
              hint={t("subscription.noRequestHint")}
            />
          </View>
        )}
        {cancelSubscriptionRequestMutation.isError ? (
          <Text style={settingsUiStyles.errorText}>
            {cancelSubscriptionRequestMutation.error instanceof Error
              ? cancelSubscriptionRequestMutation.error.message
              : t("subscription.cancelFailed")}
          </Text>
        ) : null}
        {subscriptionMessage && !canRequestUpgrade ? (
          <Text
            style={
              subscriptionMessage.toLowerCase().includes("failed") ||
              subscriptionMessage.toLowerCase().includes("required") ||
              subscriptionMessage.toLowerCase().includes("already")
                ? settingsUiStyles.errorText
                : settingsUiStyles.successText
            }
          >
            {subscriptionMessage}
          </Text>
        ) : null}
      </SettingsCard>

      {canRequestUpgrade ? renderUpgradeRequestForm() : null}

      <SettingsCard>
        <Text style={settingsUiStyles.cardTitle}>{t("subscription.planCatalog")}</Text>
        {subscriptionPlansQuery.isLoading ? <SettingsLoadingRow label={t("subscription.loadingPlans")} /> : null}
        {subscriptionPlansQuery.isError ? (
          <Text style={settingsUiStyles.errorText}>
            {subscriptionPlansQuery.error instanceof Error
              ? subscriptionPlansQuery.error.message
              : t("subscription.failedPlans")}
          </Text>
        ) : null}
        {availablePlanCatalog.map((plan) => {
          const isCurrentPlan = plan.code === currentPlanCode;
          const isSelectableUpgrade =
            canRequestUpgrade && (plan.code === "pro" || plan.code === "premium") && !isCurrentPlan;
          const isRequestedPlan = requestedPlanCode === plan.code;
          return (
            <View
              key={plan.id}
              style={[
                settingsUiStyles.planCatalogCard,
                isCurrentPlan && settingsUiStyles.planCatalogCardActive,
              ]}
            >
              <View style={settingsUiStyles.subscriptionHeaderRow}>
                <View style={settingsUiStyles.subscriptionTitleWrap}>
                  <Text style={settingsUiStyles.settingTitle}>{plan.name}</Text>
                  <Text style={settingsUiStyles.settingHint}>
                    {plan.description?.trim() || t("subscription.defaultPlanDescription")}
                  </Text>
                </View>
                <Text
                  style={[
                    settingsUiStyles.subscriptionStatusPill,
                    plan.code === "free"
                      ? settingsUiStyles.subscriptionStatusPillFree
                      : plan.code === "pro"
                        ? settingsUiStyles.subscriptionStatusPillPro
                        : settingsUiStyles.subscriptionStatusPillPremium,
                  ]}
                >
                  {isCurrentPlan ? t("subscription.current") : formatPlanCode(plan.code)}
                </Text>
              </View>
              <View style={settingsUiStyles.planFeatureList}>
                {getPlanFeatureRows(plan).map((feature) => (
                  <Text key={`${plan.id}-${feature}`} style={settingsUiStyles.planFeatureText}>
                    {`• ${feature}`}
                  </Text>
                ))}
              </View>
              {isSelectableUpgrade ? (
                <Pressable
                  style={({ pressed }) => [
                    isRequestedPlan ? settingsUiStyles.primaryButton : settingsUiStyles.secondaryButton,
                    pressed && settingsUiStyles.buttonPressed,
                  ]}
                  onPress={() =>
                    setRequestedPlanCode(plan.code as Extract<SubscriptionPlanCode, "pro" | "premium">)
                  }
                >
                  <Text
                    style={
                      isRequestedPlan
                        ? settingsUiStyles.primaryButtonLabel
                        : settingsUiStyles.secondaryButtonLabel
                    }
                  >
                    {isRequestedPlan
                      ? t("subscription.selectedForRequest")
                      : t("subscription.choosePlan", { name: plan.name })}
                  </Text>
                </Pressable>
              ) : null}
            </View>
          );
        })}
      </SettingsCard>

      <SettingsCard>
        <Text style={settingsUiStyles.cardTitle}>{t("subscription.requestHistory")}</Text>
        {ownSubscriptionRequestsQuery.isLoading ? (
          <SettingsLoadingRow label={t("subscription.loadingHistory")} />
        ) : null}
        {ownSubscriptionRequestsQuery.isError ? (
          <Text style={settingsUiStyles.errorText}>
            {ownSubscriptionRequestsQuery.error instanceof Error
              ? ownSubscriptionRequestsQuery.error.message
              : t("subscription.failedHistory")}
          </Text>
        ) : null}
        {olderSubscriptionRequests.length > 0 ? (
          olderSubscriptionRequests.map((request) => (
            <View key={request.id} style={settingsUiStyles.subscriptionHistoryCard}>
              <View style={settingsUiStyles.subscriptionHeaderRow}>
                <View style={settingsUiStyles.subscriptionTitleWrap}>
                  <Text style={settingsUiStyles.settingTitle}>
                    {t("subscription.requestTitle", {
                      plan: formatPlanCode(request.requestedPlanCode),
                    })}
                  </Text>
                  <Text style={settingsUiStyles.metaText}>
                    {formatRequestStatus(request.status)} • Created {formatDateTime(request.createdAt)}
                  </Text>
                </View>
                <Text style={settingsUiStyles.subscriptionRequestStatus}>
                  {formatRequestStatus(request.status)}
                </Text>
              </View>
              {request.transactionId ? (
                <Text style={settingsUiStyles.metaText}>
                  {t("subscription.transaction", { value: request.transactionId })}
                </Text>
              ) : null}
              <Text style={settingsUiStyles.metaText}>
                {request.hasPaymentProof
                  ? t("subscription.proofAttached")
                  : t("subscription.proofNotAttached")}
              </Text>
              {renderPaymentProofPreview(request.paymentProofImageDataUrl)}
              {request.note ? (
                <Text style={settingsUiStyles.metaText}>
                  {t("subscription.note", { value: request.note })}
                </Text>
              ) : null}
              {request.adminNote ? (
                <Text style={settingsUiStyles.metaText}>
                  {t("subscription.adminNote", { value: request.adminNote })}
                </Text>
              ) : null}
              {request.reviewer?.name ? (
                <Text style={settingsUiStyles.metaText}>
                  {t("subscription.reviewedBy", { name: request.reviewer.name })}
                </Text>
              ) : null}
            </View>
          ))
        ) : (
          <View style={settingsUiStyles.subscriptionEmptyState}>
            <Text style={settingsUiStyles.metaText}>{t("subscription.noEarlierRequests")}</Text>
            <MiniHelpHint
              hint={t("subscription.noEarlierRequestsHint")}
            />
          </View>
        )}
      </SettingsCard>

      <Modal
        animationType="fade"
        transparent
        visible={Boolean(fullscreenProofUri)}
        onRequestClose={() => setFullscreenProofUri(null)}
      >
        <View style={settingsUiStyles.proofFullscreenBackdrop}>
          <Pressable
            style={settingsUiStyles.proofFullscreenOverlay}
            onPress={() => setFullscreenProofUri(null)}
          />
          <View style={settingsUiStyles.proofFullscreenCard}>
            <View style={settingsUiStyles.proofFullscreenHeader}>
              <Text style={settingsUiStyles.proofFullscreenTitle}>{t("subscription.proofPreviewTitle")}</Text>
              <Pressable
                accessibilityRole="button"
                style={settingsUiStyles.secondaryButton}
                onPress={() => setFullscreenProofUri(null)}
              >
                <Text style={settingsUiStyles.secondaryButtonLabel}>{t("subscription.close")}</Text>
              </Pressable>
            </View>
            {fullscreenProofUri ? (
              <Image
                source={fullscreenProofUri}
                style={settingsUiStyles.proofFullscreenImage}
                contentFit="contain"
              />
            ) : null}
          </View>
        </View>
      </Modal>

      <ConfirmationSheet
        visible={Boolean(pendingCancelRequestId)}
        title={t("subscription.cancelRequestConfirmTitle")}
        message={t("subscription.cancelRequestConfirmMessage")}
        hint={t("subscription.cancelRequestConfirmHint")}
        confirmLabel={t("subscription.cancelRequest")}
        cancelLabel={t("subscription.keep")}
        confirmTone="danger"
        isPending={cancelSubscriptionRequestMutation.isPending}
        onClose={() => setPendingCancelRequestId(null)}
        onConfirm={() => {
          void confirmCancelSubscriptionRequest();
        }}
      />
    </SettingsPage>
  );
};
