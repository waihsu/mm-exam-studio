import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { AlertCircle, Loader2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { PagePanel } from "@/components/page-container";
import { toast } from "@/components/ui/sonner";
import { ADMIN_ROUTES } from "@/constants/routes";
import {
  EMPTY_SECTIONS_JSON,
  EMPTY_SLOTS_JSON,
  blueprintWizardSteps,
  createEmptyDraft,
  type BlueprintFormDraft,
  type BlueprintWizardStep,
} from "@/features/blueprints/builder/blueprint-builder.model";
import {
  blueprintDetailToDraft,
  validateBlueprintDraftBeforeSubmit,
} from "@/features/blueprints/builder/blueprint-builder.draft";
import { getBlueprintBuilderState } from "@/features/blueprints/builder/blueprint-builder-state";
import {
  blueprintNavigationIssueMessage,
  canNavigateToBlueprintStep,
  getBlueprintNextStep,
} from "@/features/blueprints/builder/blueprint-builder-navigation";
import {
  getBlueprintSubChaptersForSelectedChapters,
  getBlueprintSubChaptersForSingleChapter,
} from "@/features/blueprints/builder/blueprint-builder.presets";
import { useBlueprintStructureEditor } from "@/features/blueprints/builder/use-blueprint-structure-editor";
import { useBlueprintBuilderData } from "@/features/blueprints/builder/use-blueprint-builder-data";
import { BlueprintBuilderHeader } from "@/features/blueprints/builder/blueprint-builder-header";
import { BlueprintBuilderReview } from "@/features/blueprints/builder/blueprint-builder-review";
import { BlueprintBuilderSetupStep } from "@/features/blueprints/builder/blueprint-builder-setup-step";
import { BlueprintBuilderFiltersStep } from "@/features/blueprints/builder/blueprint-builder-filters-step";
import { BlueprintBuilderStructureStep } from "@/features/blueprints/builder/blueprint-builder-structure-step";
import { LockedQuestionPickerDialog } from "@/features/blueprints/components/locked-question-picker-dialog";
import { questionApi } from "@/features/questions/api/question.api";
import type { QuestionRecord } from "@/features/questions/types/question.type";
import {
  getChaptersForSelection,
  getSubjectsForGrade,
} from "@/features/questions/utils/question-taxonomy";

export function BlueprintBuilderPage({
  blueprintId,
}: {
  blueprintId?: string;
}) {
  const navigate = useNavigate();
  const { isEditing, metaQuery, editingDetailQuery, saveMutation } =
    useBlueprintBuilderData(blueprintId);
  const [wizardStep, setWizardStep] = useState<BlueprintWizardStep>("setup");
  const [draft, setDraft] = useState<BlueprintFormDraft>(createEmptyDraft);
  const [lockedPickerOpen, setLockedPickerOpen] = useState(false);
  const [lockedPickerSlotIndex, setLockedPickerSlotIndex] = useState<
    number | null
  >(null);
  const [lockedPickerSearch, setLockedPickerSearch] = useState("");

  useEffect(() => {
    if (!isEditing) {
      setDraft(createEmptyDraft());
      return;
    }
    if (editingDetailQuery.data)
      setDraft(blueprintDetailToDraft(editingDetailQuery.data));
  }, [editingDetailQuery.data, isEditing]);

  const subjects = useMemo(
    () => getSubjectsForGrade(metaQuery.data, draft.gradeId),
    [metaQuery.data, draft.gradeId]
  );
  const chapters = useMemo(
    () =>
      getChaptersForSelection(metaQuery.data, draft.gradeId, draft.subjectId),
    [metaQuery.data, draft.gradeId, draft.subjectId]
  );
  const subChapters = useMemo(
    () =>
      getBlueprintSubChaptersForSelectedChapters(
        metaQuery.data,
        draft.presetChapterIds
      ),
    [metaQuery.data, draft.presetChapterIds]
  );
  const builderState = useMemo(() => getBlueprintBuilderState(draft), [draft]);
  const {
    sections: parsedSections,
    slots: parsedSlots,
    hasValidDifficulty,
    setupStepReady,
    structureStepReady,
    canSaveBlueprint,
    stepAvailability,
  } = builderState;
  const { syncSections, syncSlots, applyBlueprintPreset } =
    useBlueprintStructureEditor({
      draft,
      setDraft,
    });

  const goToStep = (step: BlueprintWizardStep) => {
    if (canNavigateToBlueprintStep(step, stepAvailability)) setWizardStep(step);
  };
  const goToNextStep = () => {
    const result = getBlueprintNextStep({
      activeStep: wizardStep,
      setupStepReady,
      hasValidDifficulty,
      structureStepReady,
    });
    if (result.issue) {
      toast.error(blueprintNavigationIssueMessage[result.issue]);
      return;
    }
    if (result.nextStep) setWizardStep(result.nextStep);
  };
  const goToPreviousStep = () => {
    const index = blueprintWizardSteps.findIndex(
      step => step.key === wizardStep
    );
    const previousStep = blueprintWizardSteps[index - 1];
    if (previousStep) setWizardStep(previousStep.key);
  };

  const lockedPickerSlot =
    typeof lockedPickerSlotIndex === "number"
      ? parsedSlots[lockedPickerSlotIndex]
      : undefined;
  const lockedPickerSlotSubChapters = useMemo(
    () =>
      getBlueprintSubChaptersForSingleChapter(
        metaQuery.data,
        lockedPickerSlot?.chapterId ?? ""
      ),
    [metaQuery.data, lockedPickerSlot?.chapterId]
  );
  const lockedQuestionCandidatesQuery = useQuery({
    queryKey: [
      "blueprint-locked-question-candidates",
      lockedPickerOpen ? lockedPickerSearch.trim() : "",
      draft.gradeId,
      draft.subjectId,
      lockedPickerSlot?.chapterId ?? "",
      lockedPickerSlot?.subChapterId ?? "",
      lockedPickerSlot?.questionType ?? "",
      lockedPickerSlot?.marks ?? "",
    ],
    queryFn: async () => {
      if (!lockedPickerSlot || !draft.gradeId || !draft.subjectId)
        return [] as QuestionRecord[];
      const response = await questionApi.getQuestions({
        search: lockedPickerSearch.trim() || undefined,
        gradeId: draft.gradeId,
        subjectId: draft.subjectId,
        chapterId: lockedPickerSlot.chapterId,
        subChapterId: lockedPickerSlot.subChapterId,
        type: lockedPickerSlot.questionType,
        isPublished: true,
        page: 1,
        pageSize: 20,
      });
      if (!response.ok) throw new Error(response.message);
      return response.data.rows.filter(
        row => row.marks === lockedPickerSlot.marks
      );
    },
    enabled:
      lockedPickerOpen &&
      Boolean(lockedPickerSlot) &&
      Boolean(draft.gradeId) &&
      Boolean(draft.subjectId),
  });
  const errorMessage =
    (metaQuery.error instanceof Error && metaQuery.error.message) ||
    (editingDetailQuery.error instanceof Error &&
      editingDetailQuery.error.message) ||
    (lockedPickerOpen &&
      lockedQuestionCandidatesQuery.error instanceof Error &&
      lockedQuestionCandidatesQuery.error.message) ||
    null;

  if (metaQuery.isLoading || (isEditing && editingDetailQuery.isLoading)) {
    return (
      <PagePanel className="bg-white/88">
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading blueprint builder...
        </div>
      </PagePanel>
    );
  }

  return (
    <div className="space-y-4">
      {errorMessage ? (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Blueprint builder unavailable</AlertTitle>
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      ) : null}
      <PagePanel className="space-y-5 bg-white/88">
        <BlueprintBuilderHeader
          editing={isEditing}
          mode={draft.mode}
          status={draft.status}
          activeStep={wizardStep}
          stepAvailability={stepAvailability}
          onBack={() => void navigate({ to: ADMIN_ROUTES.questionBlueprints })}
          onStepChange={goToStep}
        />
        {wizardStep === "setup" ? (
          <BlueprintBuilderSetupStep
            draft={draft}
            onDraftChange={setDraft}
            meta={metaQuery.data}
            subjects={subjects}
          />
        ) : null}
        {wizardStep === "filters" ? (
          <BlueprintBuilderFiltersStep
            draft={draft}
            onDraftChange={setDraft}
            chapters={chapters}
            subChapters={subChapters}
            onChapterToggle={(chapterId, checked) =>
              setDraft(current => {
                const nextChapterIds = checked
                  ? [...current.presetChapterIds, chapterId]
                  : current.presetChapterIds.filter(id => id !== chapterId);
                const allowedSubChapters = new Set(
                  getBlueprintSubChaptersForSelectedChapters(
                    metaQuery.data,
                    nextChapterIds
                  ).map(item => item.id)
                );
                return {
                  ...current,
                  presetChapterIds: nextChapterIds,
                  presetSubChapterIds: current.presetSubChapterIds.filter(id =>
                    allowedSubChapters.has(id)
                  ),
                };
              })
            }
            onSubChapterToggle={(subChapterId, checked) =>
              setDraft(current => ({
                ...current,
                presetSubChapterIds: checked
                  ? [...current.presetSubChapterIds, subChapterId]
                  : current.presetSubChapterIds.filter(
                      id => id !== subChapterId
                    ),
              }))
            }
          />
        ) : null}
        {wizardStep === "structure" ? (
          <BlueprintBuilderStructureStep
            draft={draft}
            sections={parsedSections}
            slots={parsedSlots}
            meta={metaQuery.data}
            chapters={chapters}
            onApplyPreset={applyBlueprintPreset}
            onClear={() =>
              setDraft(current => ({
                ...current,
                sectionsJson: EMPTY_SECTIONS_JSON,
                slotsJson: EMPTY_SLOTS_JSON,
              }))
            }
            onSectionsChange={syncSections}
            onSlotsChange={syncSlots}
            onPickLockedQuestion={slotIndex => {
              if (!draft.gradeId || !draft.subjectId) {
                toast.error("Select grade and subject first.");
                return;
              }
              setLockedPickerSlotIndex(slotIndex);
              setLockedPickerSearch("");
              setLockedPickerOpen(true);
            }}
          />
        ) : null}
        <BlueprintBuilderReview
          draft={draft}
          step={wizardStep}
          sectionCount={parsedSections.length}
          slotCount={parsedSlots.length}
          setupReady={setupStepReady}
          difficultyValid={hasValidDifficulty}
          structureReady={structureStepReady}
          canSave={canSaveBlueprint}
          editing={isEditing}
          saving={saveMutation.isPending}
          onPrevious={goToPreviousStep}
          onNext={goToNextStep}
          onCancel={() =>
            void navigate({ to: ADMIN_ROUTES.questionBlueprints })
          }
          onSave={() => {
            try {
              saveMutation.mutate(validateBlueprintDraftBeforeSubmit(draft));
            } catch (error) {
              toast.error(
                error instanceof Error
                  ? error.message
                  : "Invalid blueprint form data"
              );
            }
          }}
        />
      </PagePanel>
      <LockedQuestionPickerDialog
        open={lockedPickerOpen}
        onOpenChange={open => {
          setLockedPickerOpen(open);
          if (!open) {
            setLockedPickerSlotIndex(null);
            setLockedPickerSearch("");
          }
        }}
        slot={lockedPickerSlot}
        availableLessonCount={lockedPickerSlotSubChapters.length}
        search={lockedPickerSearch}
        onSearchChange={setLockedPickerSearch}
        loading={lockedQuestionCandidatesQuery.isLoading}
        candidates={lockedQuestionCandidatesQuery.data}
        onChooseQuestion={candidate => {
          if (typeof lockedPickerSlotIndex !== "number") return;
          syncSlots(current =>
            current.map((item, itemIndex) =>
              itemIndex === lockedPickerSlotIndex
                ? { ...item, lockedQuestionId: candidate.id }
                : item
            )
          );
          setLockedPickerOpen(false);
          setLockedPickerSlotIndex(null);
          setLockedPickerSearch("");
        }}
      />
    </div>
  );
}
