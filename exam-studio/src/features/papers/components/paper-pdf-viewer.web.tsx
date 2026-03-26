import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useTranslation } from "@/i18n";

type PaperPdfViewerProps = {
  sourceUri: string;
  loadProgress: number;
  onLoadProgress: (progress: number) => void;
  onLoadComplete: (pageCount: number) => void;
  onPageChanged: (page: number, pageCount: number) => void;
  onError: (message: string) => void;
};

export const PaperPdfViewer = ({
  sourceUri,
  onLoadProgress,
  onError,
  onLoadComplete,
  onPageChanged,
}: PaperPdfViewerProps) => {
  const { t } = useTranslation("papers");

  React.useEffect(() => {
    onLoadProgress(1);
    onLoadComplete(1);
    onPageChanged(1, 1);
  }, [onLoadComplete, onLoadProgress, onPageChanged]);

  return (
    <View style={styles.viewerFrame}>
      <Text style={styles.title}>{t("viewer.webTitle")}</Text>
      <Text style={styles.copy}>{t("viewer.webCopy")}</Text>
      <Pressable
        style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
        onPress={() => {
          if (typeof window === "undefined") {
            onError(t("viewer.browserUnavailable"));
            return;
          }
          window.open(sourceUri, "_blank", "noopener,noreferrer");
        }}
      >
        <Text style={styles.buttonLabel}>{t("viewer.webOpen")}</Text>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  viewerFrame: {
    alignItems: "center",
    backgroundColor: "#111827",
    flex: 1,
    gap: 12,
    justifyContent: "center",
    minHeight: 0,
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  title: {
    color: "#F8FAFC",
    fontSize: 18,
    fontWeight: "800",
    textAlign: "center",
  },
  copy: {
    color: "#CBD5E1",
    fontSize: 14,
    lineHeight: 21,
    textAlign: "center",
  },
  button: {
    alignItems: "center",
    backgroundColor: "#2563EB",
    borderRadius: 12,
    justifyContent: "center",
    minHeight: 48,
    paddingHorizontal: 18,
  },
  buttonPressed: {
    opacity: 0.84,
  },
  buttonLabel: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
  },
});
