import React from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useTranslation } from "@/i18n";

type PaperPdfViewerProps = {
  sourceUri: string;
  loadProgress: number;
  onLoadProgress: (progress: number) => void;
  onLoadComplete: (pageCount: number) => void;
  onPageChanged: (page: number, pageCount: number) => void;
  onError: (message: string) => void;
};

type PdfComponentType = React.ComponentType<{
  source: { uri: string; cache: boolean };
  style: object;
  fitPolicy: 0 | 1 | 2;
  maxScale: number;
  minScale: number;
  showsHorizontalScrollIndicator: boolean;
  showsVerticalScrollIndicator: boolean;
  trustAllCerts: boolean;
  renderActivityIndicator: () => React.ReactElement;
  onLoadProgress: (percent: number) => void;
  onLoadComplete: (numberOfPages: number) => void;
  onPageChanged: (page: number, numberOfPages: number) => void;
  onError: (error: unknown) => void;
}>;

const loadPdfComponent = (): PdfComponentType | null => {
  if (Platform.OS === "web") {
    return null;
  }

  try {
    const module = require("react-native-pdf") as { default?: PdfComponentType };
    return module.default ?? null;
  } catch {
    return null;
  }
};

export const PaperPdfViewer = ({
  sourceUri,
  loadProgress,
  onLoadProgress,
  onLoadComplete,
  onPageChanged,
  onError,
}: PaperPdfViewerProps) => {
  const PdfComponent = loadPdfComponent();
  const { t } = useTranslation("papers");

  React.useEffect(() => {
    if (!PdfComponent) {
      onError(t("viewer.nativeUnavailable"));
    }
  }, [PdfComponent, onError, t]);

  if (!PdfComponent) {
    return (
      <View style={styles.unavailableState}>
        <Text style={styles.unavailableTitle}>{t("viewer.rebuildTitle")}</Text>
        <Text style={styles.unavailableCopy}>{t("viewer.rebuildCopy")}</Text>
        <View style={styles.commandCard}>
          <Text style={styles.commandText}>{t("viewer.rebuildCommand")}</Text>
        </View>
        <Pressable
          style={({ pressed }) => [styles.secondaryButton, pressed && styles.buttonPressed]}
          onPress={() => {
            onError(t("viewer.rebuildError"));
          }}
        >
          <Text style={styles.secondaryButtonLabel}>{t("viewer.rebuildReminder")}</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.viewerFrame}>
      <PdfComponent
        source={{ uri: sourceUri, cache: false }}
        style={styles.pdf}
        fitPolicy={0}
        maxScale={4}
        minScale={1}
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
        trustAllCerts={false}
        renderActivityIndicator={() => (
            <View style={styles.loadingState}>
              <ActivityIndicator color="#2563EB" size="large" />
            <Text style={styles.loadingText}>
              {t("viewer.rendering", { percent: Math.round(loadProgress * 100) })}
            </Text>
          </View>
        )}
        onLoadProgress={(percent) => {
          if (Number.isFinite(percent) && percent >= 0) {
            onLoadProgress(percent);
          }
        }}
        onLoadComplete={(numberOfPages) => {
          onLoadComplete(numberOfPages);
        }}
        onPageChanged={(page, numberOfPages) => {
          onPageChanged(page, numberOfPages);
        }}
        onError={(error) => {
          const message =
            error && typeof error === "object" && "message" in error && typeof error.message === "string"
              ? error.message
              : t("viewer.failedRender");
          onError(message);
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  viewerFrame: {
    backgroundColor: "#111827",
    borderColor: "rgba(255,255,255,0.08)",
    borderRadius: 20,
    borderWidth: 1,
    flex: 1,
    minHeight: 320,
    overflow: "hidden",
  },
  pdf: {
    flex: 1,
    width: "100%",
    backgroundColor: "#111827",
  },
  loadingState: {
    alignItems: "center",
    gap: 12,
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  loadingText: {
    color: "#E2E8F0",
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
  },
  unavailableState: {
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
    paddingVertical: 32,
  },
  unavailableTitle: {
    color: "#F8FAFC",
    fontSize: 18,
    fontWeight: "800",
    textAlign: "center",
  },
  unavailableCopy: {
    color: "#CBD5E1",
    fontSize: 14,
    lineHeight: 21,
    textAlign: "center",
  },
  commandCard: {
    backgroundColor: "rgba(37, 99, 235, 0.14)",
    borderColor: "rgba(59, 130, 246, 0.28)",
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  commandText: {
    color: "#DBEAFE",
    fontFamily: Platform.select({ ios: "Menlo", android: "monospace", default: "monospace" }),
    fontSize: 13,
    fontWeight: "700",
  },
  secondaryButton: {
    alignItems: "center",
    backgroundColor: "rgba(148, 163, 184, 0.14)",
    borderColor: "rgba(148, 163, 184, 0.18)",
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 44,
    paddingHorizontal: 14,
  },
  secondaryButtonLabel: {
    color: "#E2E8F0",
    fontSize: 13,
    fontWeight: "800",
  },
  buttonPressed: {
    opacity: 0.84,
  },
});
