import { useRouter } from "expo-router";
import {
  disableAppSwitcherProtectionAsync,
  enableAppSwitcherProtectionAsync,
  usePreventScreenCapture,
} from "expo-screen-capture";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ConfirmationSheet } from "@/components/ui/confirmation-sheet";
import { useAuthSessionQuery } from "@/features/auth/hooks/use-auth-session-query";
import { useAppDateTimeFormatter } from "@/features/settings/hooks/use-app-date-time-formatter";
import { useTranslation } from "@/i18n";
import { useQuestionPaperDetailQuery } from "../hooks/use-question-paper-detail-query";
import {
  clearCachedQuestionPaperPdfPreview,
  openQuestionPaperPdfForPrint,
  prepareQuestionPaperPdfPreview,
} from "../services/paper-pdf.service";
import { PaperPdfViewer } from "./paper-pdf-viewer";

type PaperPdfPreviewScreenProps = {
  paperId: string;
};

const WATERMARK_ROWS = [0, 1, 2];
const WATERMARK_COLUMNS = [0, 1];

export const PaperPdfPreviewScreen = ({ paperId }: PaperPdfPreviewScreenProps) => {
  usePreventScreenCapture("protected-paper-preview");

  const router = useRouter();
  const { t } = useTranslation(["papers", "common"]);
  const authSessionQuery = useAuthSessionQuery();
  const { formatDateTime } = useAppDateTimeFormatter();
  const detailQuery = useQuestionPaperDetailQuery(paperId);
  const [sourceUri, setSourceUri] = useState<string | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [loadProgress, setLoadProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [actionTone, setActionTone] = useState<"info" | "success" | "error">("info");
  const [isPreparing, setIsPreparing] = useState(true);
  const [isPrinting, setIsPrinting] = useState(false);
  const [showProtectionInfo, setShowProtectionInfo] = useState(false);
  const [previewStartedAt] = useState(() => new Date().toISOString());

  const title = useMemo(
    () => detailQuery.data?.title?.trim() || t("papers:preview.titleFallback"),
    [detailQuery.data?.title, t],
  );
  const watermarkLabel = useMemo(() => {
    const identifier =
      authSessionQuery.data?.user.email?.trim() ||
      authSessionQuery.data?.user.name?.trim() ||
      t("papers:preview.signedInUser");

    return `${identifier} • ${formatDateTime(previewStartedAt)} • ${t("papers:preview.previewOnly")}`;
  }, [
    authSessionQuery.data?.user.email,
    authSessionQuery.data?.user.name,
    formatDateTime,
    previewStartedAt,
    t,
  ]);

  const loadPdf = useCallback(async () => {
    setErrorMessage(null);
    setActionMessage(null);
    setActionTone("info");
    setIsPreparing(true);
    setLoadProgress(0);
    setSourceUri(null);

    try {
      const prepared = await prepareQuestionPaperPdfPreview(paperId);
      if (prepared.mode === "web") {
        setSourceUri(prepared.url);
      } else {
        setSourceUri(prepared.fileUri);
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : t("papers:preview.prepareFailed"));
      setSourceUri(null);
    } finally {
      setIsPreparing(false);
    }
  }, [paperId, t]);

  useEffect(() => {
    void loadPdf();

    return () => {
      void clearCachedQuestionPaperPdfPreview(paperId);
    };
  }, [loadPdf, paperId]);

  useEffect(() => {
    void enableAppSwitcherProtectionAsync(0.45).catch(() => undefined);

    return () => {
      void disableAppSwitcherProtectionAsync().catch(() => undefined);
    };
  }, []);

  const handleClose = () => {
    router.back();
  };

  const handleViewerError = (message: string) => {
    setErrorMessage(message);
  };

  const handlePrint = async () => {
    if (isPreparing || isPrinting || !detailQuery.data?.exportedAt) {
      return;
    }

    setActionMessage(null);
    setIsPrinting(true);

    try {
      await disableAppSwitcherProtectionAsync().catch(() => undefined);
      const result = await openQuestionPaperPdfForPrint(paperId);
      setActionTone("success");
      setActionMessage(
        result.mode === "web"
          ? t("papers:preview.browserOpened")
          : t("papers:preview.printOpened"),
      );
    } catch (error) {
      setActionTone("error");
      setActionMessage(error instanceof Error ? error.message : t("papers:preview.printFailed"));
    } finally {
      if (Platform.OS !== "web") {
        setTimeout(() => {
          void enableAppSwitcherProtectionAsync(0.45).catch(() => undefined);
        }, 450);
      }
      setIsPrinting(false);
    }
  };

  const viewerStatus = errorMessage
    ? errorMessage
    : isPreparing
      ? t("papers:preview.preparing")
      : pageCount > 0
        ? t("papers:preview.pageStatus", { page: currentPage, count: pageCount })
        : t("papers:preview.loadingDocument");
  const statusIsError = Boolean(errorMessage);
  const hasPrintReady = Boolean(detailQuery.data?.exportedAt);
  const pageStatusLabel =
    pageCount > 0
      ? t("papers:preview.pageStatus", { page: currentPage, count: pageCount })
      : isPreparing
        ? t("papers:preview.loading")
        : t("papers:preview.loadingDocument");
  const bottomMessage =
    errorMessage ||
    actionMessage ||
    (hasPrintReady ? t("papers:preview.printHint") : t("papers:preview.preparingInside"));
  const bottomMessageStyle =
    actionTone === "success"
      ? styles.bottomMessageSuccess
      : statusIsError || actionTone === "error"
        ? styles.bottomMessageError
        : null;

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right", "bottom"]}>
      <View style={styles.container}>
        <View style={styles.topBar}>
          <Pressable
            style={({ pressed }) => [styles.headerButton, pressed && styles.buttonPressed]}
            onPress={handleClose}
          >
            <Text style={styles.headerButtonLabel}>{t("papers:preview.back")}</Text>
          </Pressable>

          <View style={styles.topCopy}>
            <Text numberOfLines={1} style={styles.topTitle}>
              {title}
            </Text>
            <Text
              numberOfLines={1}
              style={[styles.topStatus, statusIsError && styles.topStatusError]}
            >
              {viewerStatus}
            </Text>
          </View>

          <Pressable
            disabled={isPreparing}
            style={({ pressed }) => [
              styles.headerButton,
              isPreparing && styles.headerButtonDisabled,
              pressed && !isPreparing && styles.buttonPressed,
            ]}
            onPress={() => {
              void loadPdf();
            }}
          >
            <Text style={styles.headerButtonLabel}>
              {isPreparing ? t("papers:preview.loading") : t("papers:preview.refresh")}
            </Text>
          </Pressable>
        </View>

        <View style={styles.viewerStage}>
          <View style={styles.viewerCard}>
            {isPreparing && !sourceUri ? (
              <View style={styles.centeredState}>
                <ActivityIndicator color="#60A5FA" size="large" />
                <Text style={styles.centeredStateText}>{t("papers:preview.preparingInside")}</Text>
              </View>
            ) : null}

            {!isPreparing && errorMessage ? (
              <View style={styles.centeredState}>
                <Text style={styles.errorTitle}>{t("papers:preview.unavailable")}</Text>
                <Text style={styles.centeredStateText}>{errorMessage}</Text>
                <Pressable
                  style={({ pressed }) => [styles.primaryButton, pressed && styles.buttonPressed]}
                  onPress={() => {
                    void loadPdf();
                  }}
                >
                  <Text style={styles.primaryButtonLabel}>{t("papers:preview.tryAgain")}</Text>
                </Pressable>
              </View>
            ) : null}

            {sourceUri && !errorMessage ? (
              <View style={styles.viewerStack}>
                <PaperPdfViewer
                  sourceUri={sourceUri}
                  loadProgress={loadProgress}
                  onLoadProgress={(progress) => {
                    setLoadProgress(progress);
                  }}
                  onLoadComplete={(nextPageCount) => {
                    setPageCount(nextPageCount);
                    setCurrentPage((current) =>
                      current > nextPageCount ? nextPageCount : current || 1,
                    );
                    setLoadProgress(1);
                  }}
                  onPageChanged={(page, nextPageCount) => {
                    setCurrentPage(page);
                    setPageCount(nextPageCount);
                  }}
                  onError={handleViewerError}
                />

                <View pointerEvents="none" style={styles.viewerOverlayTop}>
                  <Text style={styles.viewerChip}>{t("papers:preview.protectedTag")}</Text>
                  <Text style={styles.viewerChipMuted}>{pageStatusLabel}</Text>
                  {hasPrintReady ? (
                    <Text style={styles.viewerChipSuccess}>{t("papers:preview.exportReady")}</Text>
                  ) : null}
                </View>

                <View pointerEvents="none" style={styles.watermarkOverlay}>
                  {WATERMARK_ROWS.map((row) =>
                    WATERMARK_COLUMNS.map((column) => (
                      <View
                        key={`watermark-${row}-${column}`}
                        style={[
                          styles.watermarkStamp,
                          {
                            left: column === 0 ? "3%" : "48%",
                            top: `${12 + row * 28}%`,
                          },
                        ]}
                      >
                        <Text style={styles.watermarkText}>{watermarkLabel}</Text>
                      </View>
                    )),
                  )}
                </View>
              </View>
            ) : null}
          </View>
        </View>

        <View style={styles.bottomDock}>
          <View style={styles.bottomMetaRow}>
            <View style={styles.bottomCopy}>
              <Text style={styles.bottomEyebrow}>{t("papers:preview.footerTitle")}</Text>
              <Text numberOfLines={2} style={[styles.bottomMessage, bottomMessageStyle]}>
                {bottomMessage}
              </Text>
            </View>
            <Pressable
              style={({ pressed }) => [styles.secondaryButton, pressed && styles.buttonPressed]}
              onPress={() => setShowProtectionInfo(true)}
            >
              <Text style={styles.secondaryButtonLabel}>{t("papers:preview.safer")}</Text>
            </Pressable>
          </View>

          <Pressable
            disabled={isPreparing || isPrinting || !detailQuery.data?.exportedAt}
            style={({ pressed }) => [
              styles.primaryButton,
              (isPreparing || isPrinting || !detailQuery.data?.exportedAt) &&
                styles.headerButtonDisabled,
              pressed && !isPreparing && !isPrinting && styles.buttonPressed,
            ]}
            onPress={() => {
              void handlePrint();
            }}
          >
            {isPrinting ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.primaryButtonLabel}>{t("papers:preview.printNow")}</Text>
            )}
          </Pressable>
        </View>

        <ConfirmationSheet
          visible={showProtectionInfo}
          title={t("papers:preview.saferTitle")}
          message={t("papers:preview.saferMessage")}
          hint={t("papers:preview.saferHint")}
          confirmLabel={t("papers:preview.understood")}
          cancelLabel={null}
          onClose={() => setShowProtectionInfo(false)}
          onConfirm={() => setShowProtectionInfo(false)}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#EEF4FB",
  },
  container: {
    flex: 1,
    gap: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  topBar: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
  },
  topCopy: {
    flex: 1,
    gap: 2,
  },
  headerButton: {
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderColor: "#D8DEE9",
    borderRadius: 14,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 44,
    minWidth: 72,
    paddingHorizontal: 12,
  },
  headerButtonDisabled: {
    opacity: 0.45,
  },
  headerButtonLabel: {
    color: "#0F172A",
    fontSize: 13,
    fontWeight: "800",
  },
  buttonPressed: {
    opacity: 0.84,
  },
  topTitle: {
    color: "#0F172A",
    fontSize: 17,
    fontWeight: "800",
  },
  topStatus: {
    color: "#64748B",
    fontSize: 12,
    fontWeight: "600",
  },
  topStatusError: {
    color: "#FCA5A5",
  },
  viewerStage: {
    flex: 1,
    minHeight: 0,
  },
  viewerCard: {
    flex: 1,
    backgroundColor: "#111827",
    borderColor: "rgba(15, 23, 42, 0.08)",
    borderRadius: 28,
    borderWidth: 1,
    overflow: "hidden",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.12,
    shadowRadius: 18,
  },
  viewerStack: {
    flex: 1,
    position: "relative",
  },
  viewerOverlayTop: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    left: 14,
    position: "absolute",
    right: 14,
    top: 14,
  },
  viewerChip: {
    backgroundColor: "rgba(15, 23, 42, 0.74)",
    borderColor: "rgba(148, 163, 184, 0.22)",
    borderRadius: 999,
    borderWidth: 1,
    color: "#E2E8F0",
    fontSize: 11,
    fontWeight: "800",
    overflow: "hidden",
    paddingHorizontal: 10,
    paddingVertical: 6,
    textTransform: "uppercase",
  },
  viewerChipMuted: {
    backgroundColor: "rgba(15, 23, 42, 0.62)",
    borderColor: "rgba(148, 163, 184, 0.18)",
    borderRadius: 999,
    borderWidth: 1,
    color: "#CBD5E1",
    fontSize: 11,
    fontWeight: "700",
    overflow: "hidden",
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  viewerChipSuccess: {
    backgroundColor: "rgba(22, 101, 52, 0.82)",
    borderColor: "rgba(134, 239, 172, 0.28)",
    borderRadius: 999,
    borderWidth: 1,
    color: "#DCFCE7",
    fontSize: 11,
    fontWeight: "800",
    overflow: "hidden",
    paddingHorizontal: 10,
    paddingVertical: 6,
    textTransform: "uppercase",
  },
  centeredState: {
    alignItems: "center",
    flex: 1,
    gap: 12,
    justifyContent: "center",
    minHeight: 0,
    paddingHorizontal: 24,
  },
  watermarkOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  watermarkStamp: {
    position: "absolute",
    transform: [{ rotate: "-24deg" }],
  },
  watermarkText: {
    color: "rgba(226, 232, 240, 0.13)",
    fontSize: 14,
    fontWeight: "800",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  centeredStateText: {
    color: "#94A3B8",
    fontSize: 14,
    lineHeight: 21,
    textAlign: "center",
  },
  errorTitle: {
    color: "#F8FAFC",
    fontSize: 18,
    fontWeight: "800",
  },
  primaryButton: {
    alignItems: "center",
    backgroundColor: "#208AEF",
    borderRadius: 16,
    justifyContent: "center",
    minHeight: 48,
    paddingHorizontal: 18,
  },
  primaryButtonLabel: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
  },
  bottomDock: {
    backgroundColor: "#FFFFFF",
    borderColor: "#D8DEE9",
    borderRadius: 24,
    borderWidth: 1,
    gap: 12,
    padding: 14,
  },
  bottomMetaRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
  },
  bottomCopy: {
    flex: 1,
    gap: 4,
  },
  bottomEyebrow: {
    color: "#0F172A",
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1.4,
    textTransform: "uppercase",
  },
  bottomMessage: {
    color: "#64748B",
    fontSize: 12,
    lineHeight: 18,
  },
  bottomMessageSuccess: {
    color: "#86EFAC",
  },
  bottomMessageError: {
    color: "#FCA5A5",
  },
  secondaryButton: {
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderColor: "#CBD5E1",
    borderRadius: 14,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 42,
    paddingHorizontal: 14,
  },
  secondaryButtonLabel: {
    color: "#334155",
    fontSize: 13,
    fontWeight: "800",
  },
});
