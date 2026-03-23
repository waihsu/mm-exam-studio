import { Linking, Platform } from "react-native";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import { getAuthToken } from "@/lib/auth-token-store";
import { getQuestionPaperPdfUrl } from "./papers.service";

const PDF_CACHE_PREFIX = "question-paper-preview-";
const PDF_PRINT_PREFIX = "question-paper-print-";

const getCacheDirectory = () => {
  if (!FileSystem.cacheDirectory) {
    throw new Error("Temporary file storage is unavailable on this device.");
  }

  return FileSystem.cacheDirectory;
};

const getPreviewTargetUri = (paperId: string) =>
  `${getCacheDirectory()}${PDF_CACHE_PREFIX}${paperId}.pdf`;

const getPrintTargetUri = (paperId: string) =>
  `${getCacheDirectory()}${PDF_PRINT_PREFIX}${paperId}.pdf`;

const deleteFileIfPresent = async (fileUri: string) => {
  try {
    const info = await FileSystem.getInfoAsync(fileUri);
    if (info.exists) {
      await FileSystem.deleteAsync(fileUri, { idempotent: true });
    }
  } catch {
    // Ignore local cache cleanup failures.
  }
};

const downloadQuestionPaperPdf = async (paperId: string, fileUri: string) => {
  if (Platform.OS === "web") {
    return {
      mode: "web" as const,
      url: getQuestionPaperPdfUrl(paperId),
    };
  }

  const token = await getAuthToken();
  if (!token) {
    throw new Error("Authentication required.");
  }

  await deleteFileIfPresent(fileUri);

  const result = await FileSystem.downloadAsync(getQuestionPaperPdfUrl(paperId), fileUri, {
    headers: {
      authorization: `Bearer ${token}`,
    },
  });

  if (result.status >= 400) {
    await deleteFileIfPresent(fileUri);
    throw new Error("Failed to download PDF.");
  }

  return {
    mode: "native" as const,
    fileUri: result.uri,
  };
};

export const prepareQuestionPaperPdfPreview = async (paperId: string) =>
  downloadQuestionPaperPdf(paperId, getPreviewTargetUri(paperId));

export const prepareQuestionPaperPdfPrintExport = async (paperId: string) =>
  downloadQuestionPaperPdf(paperId, getPrintTargetUri(paperId));

export const shareQuestionPaperPdfForPrint = async (paperId: string) => {
  const prepared = await prepareQuestionPaperPdfPrintExport(paperId);

  if (prepared.mode === "web") {
    await Linking.openURL(prepared.url);
    return {
      mode: "web" as const,
      url: prepared.url,
    };
  }

  const sharingAvailable = await Sharing.isAvailableAsync();
  if (!sharingAvailable) {
    throw new Error("Print sharing is unavailable on this device.");
  }

  await Sharing.shareAsync(prepared.fileUri, {
    dialogTitle: "Share Printable PDF",
    mimeType: "application/pdf",
    UTI: "com.adobe.pdf",
  });

  return {
    mode: "native" as const,
    fileUri: prepared.fileUri,
  };
};

export const clearCachedQuestionPaperPdfPreview = async (paperId: string) => {
  if (Platform.OS === "web") {
    return;
  }

  await deleteFileIfPresent(getPreviewTargetUri(paperId));
};

export const clearCachedQuestionPaperPdfPrintExport = async (paperId: string) => {
  if (Platform.OS === "web") {
    return;
  }

  await deleteFileIfPresent(getPrintTargetUri(paperId));
};

export const clearAllCachedQuestionPaperPdfPreviews = async () => {
  if (Platform.OS === "web") {
    return;
  }

  try {
    const cacheDirectory = getCacheDirectory();
    const entries = await FileSystem.readDirectoryAsync(cacheDirectory);
    await Promise.all(
      entries
        .filter(
          (entry) =>
            entry.startsWith(PDF_CACHE_PREFIX) || entry.startsWith(PDF_PRINT_PREFIX),
        )
        .map((entry) =>
          deleteFileIfPresent(`${cacheDirectory}${entry}`),
        ),
    );
  } catch {
    // Ignore local cache cleanup failures.
  }
};
