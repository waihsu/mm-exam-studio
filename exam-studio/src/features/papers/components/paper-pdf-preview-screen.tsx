import { useRouter } from "expo-router";
import {
  disableAppSwitcherProtectionAsync,
  enableAppSwitcherProtectionAsync,
  usePreventScreenCapture,
} from "expo-screen-capture";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
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
  const [isPreparing, setIsPreparing] = useState(true);
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

  const viewerStatus = errorMessage
    ? errorMessage
    : isPreparing
      ? t("papers:preview.preparing")
      : pageCount > 0
        ? t("papers:preview.pageStatus", { page: currentPage, count: pageCount })
        : t("papers:preview.loadingDocument");

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right", "bottom"]}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Pressable style={({ pressed }) => [styles.headerButton, pressed && styles.buttonPressed]} onPress={handleClose}>
            <Text style={styles.headerButtonLabel}>{t("papers:preview.back")}</Text>
          </Pressable>

          <View style={styles.headerContent}>
            <Text numberOfLines={1} style={styles.title}>
              {title}
            </Text>
            <Text numberOfLines={1} style={styles.subtitle}>
              {t("papers:preview.subtitle")}
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
            <Text style={styles.headerButtonLabel}>{isPreparing ? t("papers:preview.loading") : t("papers:preview.refresh")}</Text>
          </Pressable>
        </View>

        <View style={styles.statusRow}>
          <Text style={[styles.statusText, errorMessage && styles.errorText]}>{viewerStatus}</Text>
          {detailQuery.data?.exportedAt ? (
            <Text style={styles.statusPill}>{t("papers:preview.exportReady")}</Text>
          ) : null}
        </View>

        <View style={styles.viewerCard}>
          {isPreparing && !sourceUri ? (
            <View style={styles.centeredState}>
              <ActivityIndicator color="#2563EB" size="large" />
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
                  setCurrentPage((current) => (current > nextPageCount ? nextPageCount : current || 1));
                  setLoadProgress(1);
                }}
                onPageChanged={(page, nextPageCount) => {
                  setCurrentPage(page);
                  setPageCount(nextPageCount);
                }}
                onError={handleViewerError}
              />

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

              <View pointerEvents="none" style={styles.watermarkBadge}>
                <Text style={styles.watermarkBadgeText}>
                  {t("papers:preview.watermarkBadge", { page: currentPage, count: pageCount || "-" })}
                </Text>
              </View>
            </View>
          ) : null}
        </View>

        <View style={styles.footerCard}>
          <Text style={styles.footerTitle}>{t("papers:preview.footerTitle")}</Text>
          <Text style={styles.footerCopy}>{t("papers:preview.footerCopy")}</Text>
          <Pressable
            style={({ pressed }) => [styles.secondaryButton, pressed && styles.buttonPressed]}
            onPress={() => setShowProtectionInfo(true)}
          >
            <Text style={styles.secondaryButtonLabel}>{t("papers:preview.safer")}</Text>
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
    backgroundColor: "#0F172A",
  },
  container: {
    flex: 1,
    gap: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
  },
  headerContent: {
    flex: 1,
    gap: 4,
  },
  title: {
    color: "#F8FAFC",
    fontSize: 18,
    fontWeight: "800",
  },
  subtitle: {
    color: "#94A3B8",
    fontSize: 12,
    lineHeight: 18,
  },
  headerButton: {
    alignItems: "center",
    backgroundColor: "rgba(148, 163, 184, 0.16)",
    borderColor: "rgba(148, 163, 184, 0.2)",
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 42,
    minWidth: 68,
    paddingHorizontal: 12,
  },
  headerButtonDisabled: {
    opacity: 0.5,
  },
  headerButtonLabel: {
    color: "#E2E8F0",
    fontSize: 13,
    fontWeight: "800",
  },
  buttonPressed: {
    opacity: 0.84,
  },
  statusRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-between",
  },
  statusText: {
    color: "#CBD5E1",
    flex: 1,
    fontSize: 13,
    fontWeight: "600",
  },
  errorText: {
    color: "#FCA5A5",
  },
  statusPill: {
    backgroundColor: "rgba(37, 99, 235, 0.16)",
    borderColor: "rgba(59, 130, 246, 0.3)",
    borderRadius: 999,
    borderWidth: 1,
    color: "#BFDBFE",
    fontSize: 11,
    fontWeight: "800",
    overflow: "hidden",
    paddingHorizontal: 10,
    paddingVertical: 6,
    textTransform: "uppercase",
  },
  viewerCard: {
    flex: 1,
  },
  viewerStack: {
    flex: 1,
    position: "relative",
  },
  centeredState: {
    alignItems: "center",
    backgroundColor: "#111827",
    borderColor: "rgba(255,255,255,0.08)",
    borderRadius: 20,
    borderWidth: 1,
    flex: 1,
    gap: 12,
    justifyContent: "center",
    minHeight: 320,
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
    color: "rgba(226, 232, 240, 0.16)",
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  watermarkBadge: {
    position: "absolute",
    right: 16,
    top: 14,
  },
  watermarkBadgeText: {
    backgroundColor: "rgba(15, 23, 42, 0.72)",
    borderColor: "rgba(148, 163, 184, 0.25)",
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
  centeredStateText: {
    color: "#CBD5E1",
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
    backgroundColor: "#2563EB",
    borderRadius: 12,
    justifyContent: "center",
    minHeight: 48,
    paddingHorizontal: 18,
  },
  primaryButtonLabel: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
  },
  footerCard: {
    backgroundColor: "rgba(15, 23, 42, 0.9)",
    borderColor: "rgba(148, 163, 184, 0.18)",
    borderRadius: 18,
    borderWidth: 1,
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  footerTitle: {
    color: "#F8FAFC",
    fontSize: 14,
    fontWeight: "800",
  },
  footerCopy: {
    color: "#CBD5E1",
    fontSize: 12,
    lineHeight: 18,
  },
  secondaryButton: {
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: "rgba(148, 163, 184, 0.14)",
    borderColor: "rgba(148, 163, 184, 0.18)",
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 40,
    paddingHorizontal: 14,
  },
  secondaryButtonLabel: {
    color: "#E2E8F0",
    fontSize: 13,
    fontWeight: "800",
  },
});
