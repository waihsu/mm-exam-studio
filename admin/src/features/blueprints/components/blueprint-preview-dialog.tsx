import type { Dispatch, SetStateAction } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AlertCircle, Loader2 } from "lucide-react";
import {
  BlueprintPreviewContent,
  type BlueprintMaterializeDraft,
} from "./blueprint-preview-content";
import type {
  GeneratedPaperSummary,
  PaperBlueprintDetail,
  PaperBlueprintPreviewSummary,
  WorkspacePaperStatus,
} from "../types";

type BlueprintPreviewDialogProps = {
  blueprintId: string | null;
  detail: PaperBlueprintDetail | undefined;
  preview: PaperBlueprintPreviewSummary | undefined;
  detailError: unknown;
  previewError: unknown;
  loading: boolean;
  materializeDraft: BlueprintMaterializeDraft;
  onMaterializeDraftChange: Dispatch<SetStateAction<BlueprintMaterializeDraft>>;
  onEdit: () => void;
  onClose: () => void;
  onMaterialize: () => void;
  materializing: boolean;
  onOpenPaperDetail: (paperId: string) => void;
  onTogglePaperStatus: (paperId: string, status: WorkspacePaperStatus) => void;
  onDeletePaper: (paper: GeneratedPaperSummary) => void;
  statusUpdatingPaperId: string | null;
  deletingPaperId: string | null;
  paperStatusUpdating: boolean;
  paperDeleting: boolean;
};

const toErrorMessage = (error: unknown, fallback: string) =>
  error instanceof Error && error.message.trim().length > 0
    ? error.message
    : fallback;

export function BlueprintPreviewDialog({
  blueprintId,
  detail,
  preview,
  detailError,
  previewError,
  loading,
  materializeDraft,
  onMaterializeDraftChange,
  onEdit,
  onClose,
  onMaterialize,
  materializing,
  onOpenPaperDetail,
  onTogglePaperStatus,
  onDeletePaper,
  statusUpdatingPaperId,
  deletingPaperId,
  paperStatusUpdating,
  paperDeleting,
}: BlueprintPreviewDialogProps) {
  return (
    <Dialog
      open={Boolean(blueprintId)}
      onOpenChange={open => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="max-h-[90vh] w-[min(960px,calc(100%-2rem))] !max-w-none overflow-y-auto p-5 sm:p-6">
        <DialogHeader>
          <DialogTitle>Check paper readiness</DialogTitle>
          <DialogDescription>
            Check whether this template can build one complete paper without
            reusing questions.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center gap-2 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-10 text-sm text-slate-600">
            <Loader2 className="h-4 w-4 animate-spin" />
            Building blueprint preview...
          </div>
        ) : detail && preview ? (
          <BlueprintPreviewContent
            detail={detail}
            preview={preview}
            materializeDraft={materializeDraft}
            onMaterializeDraftChange={onMaterializeDraftChange}
            onEdit={onEdit}
            onMaterialize={onMaterialize}
            materializing={materializing}
            onOpenPaperDetail={onOpenPaperDetail}
            onTogglePaperStatus={onTogglePaperStatus}
            onDeletePaper={onDeletePaper}
            statusUpdatingPaperId={statusUpdatingPaperId}
            deletingPaperId={deletingPaperId}
            paperStatusUpdating={paperStatusUpdating}
            paperDeleting={paperDeleting}
          />
        ) : (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Preview not available</AlertTitle>
            <AlertDescription>
              {toErrorMessage(
                detailError ?? previewError,
                "The preview summary could not be loaded for this blueprint."
              )}
            </AlertDescription>
          </Alert>
        )}
      </DialogContent>
    </Dialog>
  );
}
