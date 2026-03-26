import { Linking, Platform } from "react-native";
import * as FileSystem from "expo-file-system/legacy";
import * as Print from "expo-print";
import { getAuthToken } from "@/lib/auth-token-store";
import { getQuestionPaperPdfUrl } from "./papers.service";

const PDF_CACHE_PREFIX = "question-paper-preview-";
const PDF_PRINT_PREFIX = "question-paper-print-";
const PDF_DOWNLOAD_RETRY_COUNT = 2;

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

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

  let lastError: unknown = null;

  for (let attempt = 0; attempt < PDF_DOWNLOAD_RETRY_COUNT; attempt += 1) {
    try {
      const result = await FileSystem.downloadAsync(getQuestionPaperPdfUrl(paperId), fileUri, {
        headers: {
          authorization: `Bearer ${token}`,
        },
      });

      if (result.status < 400) {
        return {
          mode: "native" as const,
          fileUri: result.uri,
        };
      }

      await deleteFileIfPresent(fileUri);

      if (result.status === 404) {
        throw new Error("Question paper PDF was not found.");
      }

      if (result.status === 408 || result.status >= 500) {
        lastError = new Error("PDF download timed out on the server. Please retry.");
      } else {
        lastError = new Error("Failed to download PDF.");
      }
    } catch (error) {
      await deleteFileIfPresent(fileUri);
      lastError = error;
    }

    if (attempt < PDF_DOWNLOAD_RETRY_COUNT - 1) {
      await wait(350);
    }
  }

  throw (lastError instanceof Error ? lastError : new Error("Failed to download PDF."));
};

export const prepareQuestionPaperPdfPreview = async (paperId: string) =>
  downloadQuestionPaperPdf(paperId, getPreviewTargetUri(paperId));

export const prepareQuestionPaperPdfPrintExport = async (paperId: string) =>
  downloadQuestionPaperPdf(paperId, getPrintTargetUri(paperId));

export const openQuestionPaperPdfForPrint = async (paperId: string) => {
  const prepared = await prepareQuestionPaperPdfPrintExport(paperId);

  if (prepared.mode === "web") {
    await Linking.openURL(prepared.url);
    return {
      mode: "web" as const,
      url: prepared.url,
    };
  }

  await Print.printAsync({
    uri: prepared.fileUri,
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

  await Promise.all([
    deleteFileIfPresent(getPreviewTargetUri(paperId)),
    deleteFileIfPresent(getPrintTargetUri(paperId)),
  ]);
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
