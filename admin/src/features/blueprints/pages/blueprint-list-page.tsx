import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { toast } from "@/components/ui/sonner";
import { ADMIN_ROUTES } from "@/constants/routes";
import { blueprintApi } from "@/features/blueprints/api/blueprint.api";
import { getBlueprintListOverview } from "@/features/blueprints/blueprint-list-summary";
import { type BlueprintMaterializeDraft } from "@/features/blueprints/components/blueprint-preview-content";
import { BlueprintPreviewDialog } from "@/features/blueprints/components/blueprint-preview-dialog";
import { GeneratedPaperDetailDialog } from "@/features/blueprints/components/generated-paper-detail-dialog";
import { BlueprintListContent } from "@/features/blueprints/components/blueprint-list-content";
import { buildMaterializeBlueprintInput } from "@/features/blueprints/builder/blueprint-builder.draft";
import { createMaterializeDraft } from "@/features/blueprints/builder/blueprint-builder.model";
import type {
  MaterializeBlueprintInput,
  WorkspacePaperStatus,
} from "@/features/blueprints/types";

export function BlueprintListPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedBlueprintId, setSelectedBlueprintId] = useState<string | null>(
    null
  );
  const [selectedPaperId, setSelectedPaperId] = useState<string | null>(null);
  const [materializeDraft, setMaterializeDraft] =
    useState<BlueprintMaterializeDraft>(createMaterializeDraft());

  const blueprintsQuery = useQuery({
    queryKey: ["question-blueprints"],
    queryFn: async () => {
      const response = await blueprintApi.getBlueprints();
      if (!response.ok) throw new Error(response.message);
      return response.data;
    },
  });
  const detailQuery = useQuery({
    queryKey: ["question-blueprint", selectedBlueprintId],
    queryFn: async () => {
      if (!selectedBlueprintId) throw new Error("No blueprint selected.");
      const response = await blueprintApi.getBlueprint(selectedBlueprintId);
      if (!response.ok) throw new Error(response.message);
      return response.data;
    },
    enabled: Boolean(selectedBlueprintId),
  });
  const previewSummaryQuery = useQuery({
    queryKey: ["question-blueprint-preview-summary", selectedBlueprintId],
    queryFn: async () => {
      if (!selectedBlueprintId) throw new Error("No blueprint selected.");
      const response =
        await blueprintApi.getPreviewSummary(selectedBlueprintId);
      if (!response.ok) throw new Error(response.message);
      return response.data;
    },
    enabled: Boolean(selectedBlueprintId),
  });
  const selectedPaperDetailQuery = useQuery({
    queryKey: ["workspace-paper-detail", selectedPaperId],
    queryFn: async () => {
      if (!selectedPaperId) throw new Error("No paper selected.");
      const response = await blueprintApi.getPaperDetail(selectedPaperId);
      if (!response.ok) throw new Error(response.message);
      return response.data;
    },
    enabled: Boolean(selectedPaperId),
  });

  const deleteMutation = useMutation({
    mutationFn: async (blueprintId: string) => {
      const response = await blueprintApi.deleteBlueprint(blueprintId);
      if (!response.ok) throw new Error(response.message);
      return response.data;
    },
    onSuccess: async () => {
      toast.success("Blueprint deleted");
      await queryClient.invalidateQueries({
        queryKey: ["question-blueprints"],
      });
      if (selectedBlueprintId) setSelectedBlueprintId(null);
    },
    onError: error =>
      toast.error(
        error instanceof Error ? error.message : "Failed to delete blueprint"
      ),
  });
  const materializeMutation = useMutation({
    mutationFn: async (params: {
      blueprintId: string;
      input: MaterializeBlueprintInput;
    }) => {
      const response = await blueprintApi.materializeBlueprint(
        params.blueprintId,
        params.input
      );
      if (!response.ok) throw new Error(response.message);
      return response.data;
    },
    onSuccess: async paper => {
      toast.success(`Generated paper: ${paper.title}`);
      await queryClient.invalidateQueries({
        queryKey: ["question-blueprints"],
      });
      await queryClient.invalidateQueries({ queryKey: ["question-blueprint"] });
      await queryClient.invalidateQueries({
        queryKey: ["question-blueprint-preview-summary"],
      });
    },
    onError: error =>
      toast.error(
        error instanceof Error ? error.message : "Failed to generate paper"
      ),
  });
  const paperStatusMutation = useMutation({
    mutationFn: async (params: {
      paperId: string;
      status: WorkspacePaperStatus;
    }) => {
      const response = await blueprintApi.updatePaperStatus(
        params.paperId,
        params.status
      );
      if (!response.ok) throw new Error(response.message);
      return response.data;
    },
    onSuccess: async paper => {
      toast.success(
        paper.status === "finalized"
          ? "Paper finalized"
          : "Paper moved back to draft"
      );
      setSelectedPaperId(paper.id);
      await queryClient.invalidateQueries({
        queryKey: ["question-blueprints"],
      });
      await queryClient.invalidateQueries({ queryKey: ["question-blueprint"] });
      await queryClient.invalidateQueries({
        queryKey: ["question-blueprint-preview-summary"],
      });
      await queryClient.invalidateQueries({
        queryKey: ["workspace-paper-detail"],
      });
    },
    onError: error =>
      toast.error(
        error instanceof Error ? error.message : "Failed to update paper status"
      ),
  });
  const deletePaperMutation = useMutation({
    mutationFn: async (paperId: string) => {
      const response = await blueprintApi.deletePaper(paperId);
      if (!response.ok) throw new Error(response.message);
      return response.data;
    },
    onSuccess: async result => {
      toast.success("Generated paper deleted");
      if (selectedPaperId === result.id) setSelectedPaperId(null);
      await queryClient.invalidateQueries({
        queryKey: ["question-blueprints"],
      });
      await queryClient.invalidateQueries({ queryKey: ["question-blueprint"] });
      await queryClient.invalidateQueries({
        queryKey: ["question-blueprint-preview-summary"],
      });
      await queryClient.invalidateQueries({
        queryKey: ["workspace-paper-detail"],
      });
    },
    onError: error =>
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to delete generated paper"
      ),
  });

  useEffect(() => {
    if (!selectedBlueprintId) {
      setMaterializeDraft(createMaterializeDraft());
      setSelectedPaperId(null);
      return;
    }
    if (detailQuery.data)
      setMaterializeDraft(createMaterializeDraft(detailQuery.data.title));
  }, [detailQuery.data, selectedBlueprintId]);

  const rows = useMemo(
    () => blueprintsQuery.data?.rows ?? [],
    [blueprintsQuery.data?.rows]
  );
  const overview = useMemo(() => getBlueprintListOverview(rows), [rows]);
  const errorMessage =
    (blueprintsQuery.error instanceof Error && blueprintsQuery.error.message) ||
    (detailQuery.error instanceof Error && detailQuery.error.message) ||
    (previewSummaryQuery.error instanceof Error &&
      previewSummaryQuery.error.message) ||
    (Boolean(selectedPaperId) &&
      selectedPaperDetailQuery.error instanceof Error &&
      selectedPaperDetailQuery.error.message) ||
    null;

  return (
    <div className="space-y-4">
      {errorMessage ? (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Blueprint workspace unavailable</AlertTitle>
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      ) : null}
      <BlueprintListContent
        rows={rows}
        overview={overview}
        loading={blueprintsQuery.isLoading}
        deletingBlueprintId={
          deleteMutation.isPending ? deleteMutation.variables : undefined
        }
        onCreate={() =>
          void navigate({ to: ADMIN_ROUTES.questionBlueprintsNew })
        }
        onPreview={setSelectedBlueprintId}
        onEdit={blueprintId =>
          void navigate({
            to: "/questions/blueprints/$blueprintId/edit",
            params: { blueprintId },
          })
        }
        onDelete={row => {
          if (
            typeof window !== "undefined" &&
            !window.confirm(`Delete blueprint "${row.title}"?`)
          )
            return;
          deleteMutation.mutate(row.id);
        }}
      />
      <BlueprintPreviewDialog
        blueprintId={selectedBlueprintId}
        detail={detailQuery.data}
        preview={previewSummaryQuery.data}
        detailError={detailQuery.error}
        previewError={previewSummaryQuery.error}
        loading={detailQuery.isLoading || previewSummaryQuery.isLoading}
        materializeDraft={materializeDraft}
        onMaterializeDraftChange={setMaterializeDraft}
        onEdit={() => {
          if (!selectedBlueprintId) return;
          void navigate({
            to: "/questions/blueprints/$blueprintId/edit",
            params: { blueprintId: selectedBlueprintId },
          });
        }}
        onClose={() => {
          setSelectedBlueprintId(null);
          setSelectedPaperId(null);
        }}
        onMaterialize={() => {
          if (!selectedBlueprintId) return;
          materializeMutation.mutate({
            blueprintId: selectedBlueprintId,
            input: buildMaterializeBlueprintInput(materializeDraft),
          });
        }}
        materializing={materializeMutation.isPending}
        onOpenPaperDetail={setSelectedPaperId}
        onTogglePaperStatus={(paperId, status) =>
          paperStatusMutation.mutate({ paperId, status })
        }
        onDeletePaper={paper => {
          if (
            typeof window !== "undefined" &&
            !window.confirm(`Delete generated paper "${paper.title}"?`)
          )
            return;
          deletePaperMutation.mutate(paper.id);
        }}
        statusUpdatingPaperId={paperStatusMutation.variables?.paperId ?? null}
        deletingPaperId={deletePaperMutation.variables ?? null}
        paperStatusUpdating={paperStatusMutation.isPending}
        paperDeleting={deletePaperMutation.isPending}
      />
      <GeneratedPaperDetailDialog
        paperId={selectedPaperId}
        paper={selectedPaperDetailQuery.data}
        loading={selectedPaperDetailQuery.isLoading}
        onOpenChange={open => {
          if (!open) setSelectedPaperId(null);
        }}
      />
    </div>
  );
}
