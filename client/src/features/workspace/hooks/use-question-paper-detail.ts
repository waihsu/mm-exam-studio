import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { workspaceApi } from "@/features/workspace/api/workspace-api";

export type QuestionPaperFormState = {
  title: string;
  schoolName: string;
  academicYear: string;
  instructions: string;
  brandAssetId: string;
  includeAnswerKey: boolean;
};

const invalidatePaperCaches = async (
  queryClient: ReturnType<typeof useQueryClient>,
  paperId: string,
) => {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: ["workspace-paper", paperId] }),
    queryClient.invalidateQueries({ queryKey: ["workspace-papers"] }),
    queryClient.invalidateQueries({ queryKey: ["workspace-summary"] }),
  ]);
};

const saveBlobAsFile = (blob: Blob, fileName: string) => {
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = objectUrl;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1_000);
};

export const buildQuestionPaperForm = (
  paper: {
    title?: string;
    schoolName?: string | null;
    academicYear?: string | null;
    instructions?: string | null;
    brandAsset?: { id?: string } | null;
    includeAnswerKey?: boolean;
  } | null,
): QuestionPaperFormState => ({
  title: paper?.title ?? "",
  schoolName: paper?.schoolName ?? "",
  academicYear: paper?.academicYear ?? "",
  instructions: paper?.instructions ?? "",
  brandAssetId: paper?.brandAsset?.id ?? "",
  includeAnswerKey: paper?.includeAnswerKey ?? false,
});

export const useQuestionPaperDetail = (paperId: string) => {
  const queryClient = useQueryClient();

  const paperQuery = useQuery({
    queryKey: ["workspace-paper", paperId],
    queryFn: () => workspaceApi.getQuestionPaper(paperId),
  });

  const brandingQuery = useQuery({
    queryKey: ["workspace-branding"],
    queryFn: () => workspaceApi.listBrandAssets(),
  });

  const pdfMutation = useMutation({
    mutationFn: () => workspaceApi.downloadQuestionPaperPdf(paperId),
    onSuccess: async (response) => {
      if (!response.ok) return;
      saveBlobAsFile(response.data.blob, response.data.fileName);
      await invalidatePaperCaches(queryClient, paperId);
    },
  });

  const updateMutation = useMutation({
    mutationFn: (form: QuestionPaperFormState) =>
      workspaceApi.updateQuestionPaper(paperId, {
        ...form,
        brandAssetId: form.brandAssetId || null,
      }),
    onSuccess: async (response) => {
      if (!response.ok) return;
      await invalidatePaperCaches(queryClient, paperId);
    },
  });

  const statusMutation = useMutation({
    mutationFn: (status: "draft" | "finalized") =>
      workspaceApi.updateQuestionPaperStatus(paperId, status),
    onSuccess: async (response) => {
      if (!response.ok) return;
      await invalidatePaperCaches(queryClient, paperId);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => workspaceApi.deleteQuestionPaper(paperId),
    onSuccess: async (response) => {
      if (!response.ok) return;
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["workspace-papers"] }),
        queryClient.invalidateQueries({ queryKey: ["workspace-summary"] }),
      ]);
    },
  });

  return {
    paperQuery,
    brandingQuery,
    pdfMutation,
    updateMutation,
    statusMutation,
    deleteMutation,
  };
};
