import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import {
  AlertCircle,
  CheckCircle2,
  FileWarning,
  Layers3,
  Loader2,
  Orbit,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PagePanel } from "@/components/page-container";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/components/ui/sonner";
import { ADMIN_ROUTES } from "@/constants/routes";
import { blueprintApi } from "@/features/blueprints/api/blueprint.api";
import { BlueprintPreviewContent, type BlueprintMaterializeDraft } from "@/features/blueprints/components/blueprint-preview-content";
import { BlueprintRow } from "@/features/blueprints/components/blueprint-row";
import { BlueprintSummaryCard } from "@/features/blueprints/components/blueprint-summary-card";
import { questionApi } from "@/features/questions/api/question.api";
import type { QuestionMeta, QuestionRecord } from "@/features/questions/types/question.type";
import {
  getChaptersForSelection,
  getSubjectsForGrade,
} from "@/features/questions/utils/question-taxonomy";
import type {
  MaterializeBlueprintInput,
  PaperBlueprintDetail,
  PaperBlueprintMode,
  PaperBlueprintStatus,
  PaperBlueprintSubmitInput,
  PaperBlueprintDifficulty,
  PaperBlueprintPlanCode,
  PaperBlueprintQuestionType,
  PaperBlueprintSectionInput,
  PaperBlueprintSlotInput,
  PaperPdfTemplateKey,
  WorkspacePaperStatus,
} from "@/features/blueprints/types";
import {
  blueprintModeLabel,
  blueprintStatusLabel,
  blueprintStatusTone,
  formatBlueprintDateTime,
  toPlainBlueprintPreview,
} from "@/features/blueprints/utils/blueprint-display";
import { cn } from "@/lib/utils";

const modeGuidance: Record<
  PaperBlueprintMode,
  {
    title: string;
    description: string;
  }
> = {
  mcq_only: {
    title: "Fastest setup",
    description:
      "Use difficulty + chapter filters only. No sections or slots are required unless you want tighter control.",
  },
  all_type: {
    title: "Balanced preset paper",
    description:
      "Define sections by question type and marks, then let the backend fill each section from the eligible bank.",
  },
  custom: {
    title: "Full slot-by-slot control",
    description:
      "Define exact slots for each question position, including difficulty targets, swap limits, and optional locked questions.",
  },
};

const difficultyPresets = [
  {
    key: "balanced",
    label: "Balanced",
    values: { easy: "40", normal: "30", hard: "20", advance: "10" },
  },
  {
    key: "easier",
    label: "Easier",
    values: { easy: "50", normal: "30", hard: "15", advance: "5" },
  },
  {
    key: "harder",
    label: "Harder",
    values: { easy: "25", normal: "45", hard: "20", advance: "10" },
  },
] as const;

const summaryCardTone = {
  total: "border-slate-200 bg-white/90 text-slate-900",
  ready: "border-emerald-200 bg-emerald-50/80 text-emerald-950",
  custom: "border-sky-200 bg-sky-50/80 text-sky-950",
  issues: "border-amber-200 bg-amber-50/80 text-amber-950",
} as const;

const toErrorMessage = (error: unknown, fallback: string) =>
  error instanceof Error && error.message.trim().length > 0 ? error.message : fallback;

type BlueprintFormDraft = {
  title: string;
  mode: PaperBlueprintMode;
  status: PaperBlueprintStatus;
  gradeId: string;
  subjectId: string;
  totalMarks: string;
  pdfTemplateKey: PaperPdfTemplateKey;
  examYearLabel: string;
  timeAllowedLabel: string;
  departmentLine: string;
  answerInstructionLine: string;
  includeAnswerPaper: boolean;
  publishToUsers: boolean;
  availablePlanCodes: PaperBlueprintPlanCode[];
  difficultyDistribution: {
    easy: string;
    normal: string;
    hard: string;
    advance: string;
  };
  presetChapterIds: string[];
  presetSubChapterIds: string[];
  sectionsJson: string;
  slotsJson: string;
};

type BlueprintWizardStep = "setup" | "filters" | "structure" | "review";

const EMPTY_SECTIONS_JSON = "[]";
const EMPTY_SLOTS_JSON = "[]";

const blueprintWizardSteps: Array<{
  key: BlueprintWizardStep;
  label: string;
  description: string;
}> = [
  {
    key: "setup",
    label: "Setup",
    description: "Core paper identity",
  },
  {
    key: "filters",
    label: "Filters",
    description: "Difficulty and scope",
  },
  {
    key: "structure",
    label: "Structure",
    description: "Sections and slots",
  },
  {
    key: "review",
    label: "Review",
    description: "Final check",
  },
];

const createEmptyDraft = (): BlueprintFormDraft => ({
  title: "",
  mode: "mcq_only",
  status: "draft",
  gradeId: "",
  subjectId: "",
  totalMarks: "50",
  pdfTemplateKey: "default",
  examYearLabel: "",
  timeAllowedLabel: "",
  departmentLine: "",
  answerInstructionLine: "",
  includeAnswerPaper: false,
  publishToUsers: false,
  availablePlanCodes: [],
  difficultyDistribution: {
    easy: "40",
    normal: "30",
    hard: "20",
    advance: "10",
  },
  presetChapterIds: [],
  presetSubChapterIds: [],
  sectionsJson: EMPTY_SECTIONS_JSON,
  slotsJson: EMPTY_SLOTS_JSON,
});

const createMaterializeDraft = (title = ""): BlueprintMaterializeDraft => ({
  title,
  schoolName: "",
  academicYear: "",
  instructions: "",
});

const formatSectionsJson = (detail: PaperBlueprintDetail) =>
  JSON.stringify(
    detail.sections.map((section) => ({
      code: section.code,
      title: section.title ?? undefined,
      questionType: section.questionType ?? undefined,
      marksPerQuestion: section.marksPerQuestion ?? undefined,
      questionCount: section.questionCount,
      totalMarks: section.totalMarks,
      sortOrder: section.sortOrder,
    })),
    null,
    2,
  );

const formatSlotsJson = (detail: PaperBlueprintDetail) =>
  JSON.stringify(
    detail.slots.map((slot) => ({
      sectionCode: slot.sectionCode ?? undefined,
      slotNumber: slot.slotNumber,
      questionType: slot.questionType,
      marks: slot.marks,
      difficultyTarget: slot.difficultyTarget ?? undefined,
      chapterId: slot.chapterId ?? undefined,
      subChapterId: slot.subChapterId ?? undefined,
      lockedQuestionId: slot.lockedQuestion?.id ?? undefined,
      swapLimit: slot.swapLimit,
      slotConfig: slot.slotConfig ?? undefined,
    })),
    null,
    2,
  );

const detailToDraft = (detail: PaperBlueprintDetail): BlueprintFormDraft => ({
  title: detail.title,
  mode: detail.mode,
  status: detail.status,
  gradeId: detail.grade.id,
  subjectId: detail.subject.id,
  totalMarks: String(detail.totalMarks),
  pdfTemplateKey: detail.pdfTemplateKey,
  examYearLabel: detail.examYearLabel ?? "",
  timeAllowedLabel: detail.timeAllowedLabel ?? "",
  departmentLine: detail.departmentLine ?? "",
  answerInstructionLine: detail.answerInstructionLine ?? "",
  includeAnswerPaper: detail.includeAnswerPaper,
  publishToUsers: detail.templateConfig.isPublished,
  availablePlanCodes: detail.templateConfig.availablePlanCodes,
  difficultyDistribution: {
    easy: String(detail.difficultyDistribution.easy),
    normal: String(detail.difficultyDistribution.normal),
    hard: String(detail.difficultyDistribution.hard),
    advance: String(detail.difficultyDistribution.advance),
  },
  presetChapterIds: detail.presetConfig.chapterIds ?? [],
  presetSubChapterIds: detail.presetConfig.subChapterIds ?? [],
  sectionsJson: formatSectionsJson(detail),
  slotsJson: formatSlotsJson(detail),
});

const parseJsonArray = <T,>(label: string, value: string): T[] => {
  const trimmed = value.trim();
  if (!trimmed) return [];

  try {
    const parsed = JSON.parse(trimmed) as unknown;
    if (!Array.isArray(parsed)) {
      throw new Error(`${label} must be a JSON array.`);
    }
    return parsed as T[];
  } catch (error) {
    throw new Error(
      error instanceof Error ? error.message : `Invalid ${label.toLowerCase()} JSON.`,
    );
  }
};

const toDraftNumber = (value: string, label: string) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    throw new Error(`${label} must be a valid number.`);
  }
  return Math.trunc(parsed);
};

const validateBlueprintDraftBeforeSubmit = (
  draft: BlueprintFormDraft,
): PaperBlueprintSubmitInput => {
  if (!draft.title.trim()) {
    throw new Error("Blueprint title is required.");
  }
  if (!draft.gradeId) {
    throw new Error("Please select a grade.");
  }
  if (!draft.subjectId) {
    throw new Error("Please select a subject.");
  }

  const easy = toDraftNumber(draft.difficultyDistribution.easy, "Easy %");
  const normal = toDraftNumber(draft.difficultyDistribution.normal, "Normal %");
  const hard = toDraftNumber(draft.difficultyDistribution.hard, "Hard %");
  const advance = toDraftNumber(draft.difficultyDistribution.advance, "Advance %");

  if (easy + normal + hard + advance !== 100) {
    throw new Error("Difficulty distribution must total exactly 100%.");
  }
  if (hard + advance > 30) {
    throw new Error("Hard + advance must not exceed 30%.");
  }

  if (draft.publishToUsers && draft.availablePlanCodes.length < 1) {
    throw new Error("Choose at least one plan before publishing this template.");
  }

  const sections = parseJsonArray<PaperBlueprintSectionInput>(
    "Sections",
    draft.sectionsJson,
  );
  const slots = parseJsonArray<PaperBlueprintSlotInput>("Slots", draft.slotsJson);

  for (const [index, section] of sections.entries()) {
    if (!section.code?.trim()) {
      throw new Error(`Section ${index + 1} code is required.`);
    }
  }
  for (const [index, slot] of slots.entries()) {
    if (!slot.questionType) {
      throw new Error(`Slot ${index + 1} question type is required.`);
    }
  }
  if (draft.mode === "custom" && slots.length < 1) {
    throw new Error("Custom blueprint needs at least one slot.");
  }

  return buildSubmitInput(draft);
};

const buildSubmitInput = (draft: BlueprintFormDraft): PaperBlueprintSubmitInput => ({
  title: draft.title.trim(),
  mode: draft.mode,
  status: draft.status,
  gradeId: draft.gradeId,
  subjectId: draft.subjectId,
  totalMarks: toDraftNumber(draft.totalMarks, "Total marks"),
  pdfTemplateKey: draft.pdfTemplateKey,
  examYearLabel: draft.examYearLabel.trim() || undefined,
  timeAllowedLabel: draft.timeAllowedLabel.trim() || undefined,
  departmentLine: draft.departmentLine.trim() || undefined,
  answerInstructionLine: draft.answerInstructionLine.trim() || undefined,
  includeAnswerPaper: draft.includeAnswerPaper,
  templateConfig: {
    isPublished: draft.publishToUsers,
    availablePlanCodes: draft.availablePlanCodes,
  },
  difficultyDistribution: {
    easy: toDraftNumber(draft.difficultyDistribution.easy, "Easy %"),
    normal: toDraftNumber(draft.difficultyDistribution.normal, "Normal %"),
    hard: toDraftNumber(draft.difficultyDistribution.hard, "Hard %"),
    advance: toDraftNumber(draft.difficultyDistribution.advance, "Advance %"),
  },
  presetConfig: {
    chapterIds: draft.presetChapterIds,
    subChapterIds: draft.presetSubChapterIds,
  },
  sections: parseJsonArray("Sections", draft.sectionsJson),
  slots: parseJsonArray("Slots", draft.slotsJson),
});

const buildMaterializeInput = (
  draft: BlueprintMaterializeDraft,
): MaterializeBlueprintInput => ({
  title: draft.title.trim() || undefined,
  schoolName: draft.schoolName.trim() || undefined,
  academicYear: draft.academicYear.trim() || undefined,
  instructions: draft.instructions.trim() || undefined,
});

const getSubChaptersForSelectedChapters = (
  meta: QuestionMeta | undefined,
  chapterIds: string[],
) => {
  if (!meta || chapterIds.length === 0) return [];
  const allowed = new Set(chapterIds);
  return meta.subChapters.filter((subChapter) => allowed.has(subChapter.chapterId));
};

const getSubChaptersForSingleChapter = (
  meta: QuestionMeta | undefined,
  chapterId: string,
) => {
  if (!meta || !chapterId) return [];
  return meta.subChapters.filter((subChapter) => subChapter.chapterId === chapterId);
};

const createAllTypePresetSections = (): PaperBlueprintSectionInput[] => [
  {
    code: "A",
    title: "Section A · MCQ",
    questionType: "mcq",
    marksPerQuestion: 1,
    questionCount: 10,
    totalMarks: 10,
    sortOrder: 1,
  },
  {
    code: "B",
    title: "Section B · True/False",
    questionType: "true_false",
    marksPerQuestion: 1,
    questionCount: 5,
    totalMarks: 5,
    sortOrder: 2,
  },
  {
    code: "C",
    title: "Section C · Fill in the blank",
    questionType: "fill_blank",
    marksPerQuestion: 1,
    questionCount: 5,
    totalMarks: 5,
    sortOrder: 3,
  },
  {
    code: "D",
    title: "Section D · Short answer (2 marks)",
    questionType: "short_answer",
    marksPerQuestion: 2,
    questionCount: 5,
    totalMarks: 10,
    sortOrder: 4,
  },
  {
    code: "E",
    title: "Section E · Short answer (3 marks)",
    questionType: "short_answer",
    marksPerQuestion: 3,
    questionCount: 5,
    totalMarks: 15,
    sortOrder: 5,
  },
  {
    code: "F",
    title: "Section F · Matching",
    questionType: "matching",
    marksPerQuestion: 5,
    questionCount: 1,
    totalMarks: 5,
    sortOrder: 6,
  },
];

const createCustomPresetSections = (): PaperBlueprintSectionInput[] => [
  {
    code: "A",
    title: "Section A · MCQ",
    questionType: "mcq",
    marksPerQuestion: 1,
    questionCount: 10,
    totalMarks: 10,
    sortOrder: 1,
  },
  {
    code: "B",
    title: "Section B · 2-mark questions",
    questionType: "short_answer",
    marksPerQuestion: 2,
    questionCount: 5,
    totalMarks: 10,
    sortOrder: 2,
  },
  {
    code: "C",
    title: "Section C · 3-mark questions",
    questionType: "short_answer",
    marksPerQuestion: 3,
    questionCount: 5,
    totalMarks: 15,
    sortOrder: 3,
  },
  {
    code: "D",
    title: "Section D · Matching",
    questionType: "matching",
    marksPerQuestion: 5,
    questionCount: 3,
    totalMarks: 15,
    sortOrder: 4,
  },
];

const createCustomPresetSlots = (
  sections: PaperBlueprintSectionInput[],
): PaperBlueprintSlotInput[] => {
  const difficultyCycle: PaperBlueprintDifficulty[] = [
    "easy",
    "normal",
    "hard",
    "advance",
  ];

  const slots: PaperBlueprintSlotInput[] = [];
  let slotNumber = 1;
  for (const section of sections) {
    const questionType = section.questionType ?? "mcq";
    const marks = section.marksPerQuestion ?? 1;
    for (let index = 0; index < section.questionCount; index += 1) {
      slots.push({
        sectionCode: section.code,
        slotNumber,
        questionType,
        marks,
        difficultyTarget: difficultyCycle[(slotNumber - 1) % difficultyCycle.length],
        swapLimit: 3,
      });
      slotNumber += 1;
    }
  }

  return slots;
};

const getSectionTotalMarks = (sections: PaperBlueprintSectionInput[]) =>
  sections.reduce((sum, section) => sum + section.totalMarks, 0);

const hasJsonContent = (value: string) => {
  const trimmed = value.trim();
  return trimmed.length > 0 && trimmed !== "[]";
};

const questionTypeOptions: Array<{
  value: PaperBlueprintQuestionType;
  label: string;
}> = [
  { value: "mcq", label: "MCQ" },
  { value: "true_false", label: "True / false" },
  { value: "fill_blank", label: "Fill blank" },
  { value: "short_answer", label: "Short answer" },
  { value: "matching", label: "Matching" },
  { value: "long_answer", label: "Long answer" },
];

const markOptions = [1, 2, 3, 5, 10] as const;
const difficultyOptions: Array<{
  value: PaperBlueprintDifficulty;
  label: string;
}> = [
  { value: "easy", label: "Easy" },
  { value: "normal", label: "Normal" },
  { value: "hard", label: "Hard" },
  { value: "advance", label: "Advance" },
];

const planOptions: Array<{
  value: PaperBlueprintPlanCode;
  label: string;
  description: string;
}> = [
  { value: "free", label: "Free", description: "Visible to starter users." },
  { value: "pro", label: "Pro", description: "Visible to Pro subscribers." },
  { value: "premium", label: "Premium", description: "Visible to Premium subscribers." },
];

const pdfTemplateOptions: Array<{
  value: PaperPdfTemplateKey;
  label: string;
  description: string;
}> = [
  {
    value: "default",
    label: "Default",
    description: "General clean paper layout for any subject.",
  },
  {
    value: "myanmar_matric",
    label: "Myanmar Matric",
    description: "Formal exam-paper header, serif typography, and section-first layout.",
  },
];

export const Route = createFileRoute("/_protected/questions/blueprints")({
  component: BlueprintsLayout,
});

function BlueprintsLayout() {
  return <Outlet />;
}

export function BlueprintListPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedBlueprintId, setSelectedBlueprintId] = useState<string | null>(null);
  const [selectedPaperId, setSelectedPaperId] = useState<string | null>(null);
  const [materializeDraft, setMaterializeDraft] = useState<BlueprintMaterializeDraft>(
    createMaterializeDraft(),
  );

  const blueprintsQuery = useQuery({
    queryKey: ["question-blueprints"],
    queryFn: async () => {
      const response = await blueprintApi.getBlueprints();
      if (!response.ok) {
        throw new Error(response.message);
      }
      return response.data;
    },
  });

  const detailQuery = useQuery({
    queryKey: ["question-blueprint", selectedBlueprintId],
    queryFn: async () => {
      if (!selectedBlueprintId) {
        throw new Error("No blueprint selected.");
      }
      const response = await blueprintApi.getBlueprint(selectedBlueprintId);
      if (!response.ok) {
        throw new Error(response.message);
      }
      return response.data;
    },
    enabled: Boolean(selectedBlueprintId),
  });

  const previewSummaryQuery = useQuery({
    queryKey: ["question-blueprint-preview-summary", selectedBlueprintId],
    queryFn: async () => {
      if (!selectedBlueprintId) {
        throw new Error("No blueprint selected.");
      }
      const response = await blueprintApi.getPreviewSummary(selectedBlueprintId);
      if (!response.ok) {
        throw new Error(response.message);
      }
      return response.data;
    },
    enabled: Boolean(selectedBlueprintId),
  });

  const deleteMutation = useMutation({
    mutationFn: async (blueprintId: string) => {
      const response = await blueprintApi.deleteBlueprint(blueprintId);
      if (!response.ok) {
        throw new Error(response.message);
      }
      return response.data;
    },
    onSuccess: async () => {
      toast.success("Blueprint deleted");
      await queryClient.invalidateQueries({ queryKey: ["question-blueprints"] });
      if (selectedBlueprintId) {
        setSelectedBlueprintId(null);
      }
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Failed to delete blueprint",
      );
    },
  });

  const materializeMutation = useMutation({
    mutationFn: async (params: { blueprintId: string; input: MaterializeBlueprintInput }) => {
      const response = await blueprintApi.materializeBlueprint(
        params.blueprintId,
        params.input,
      );
      if (!response.ok) {
        throw new Error(response.message);
      }
      return response.data;
    },
    onSuccess: async (paper) => {
      toast.success(`Generated paper: ${paper.title}`);
      await queryClient.invalidateQueries({ queryKey: ["question-blueprints"] });
      await queryClient.invalidateQueries({ queryKey: ["question-blueprint"] });
      await queryClient.invalidateQueries({
        queryKey: ["question-blueprint-preview-summary"],
      });
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Failed to generate paper",
      );
    },
  });

  const paperStatusMutation = useMutation({
    mutationFn: async (params: {
      paperId: string;
      status: WorkspacePaperStatus;
    }) => {
      const response = await blueprintApi.updatePaperStatus(
        params.paperId,
        params.status,
      );
      if (!response.ok) {
        throw new Error(response.message);
      }
      return response.data;
    },
    onSuccess: async (paper) => {
      toast.success(
        paper.status === "finalized" ? "Paper finalized" : "Paper moved back to draft",
      );
      setSelectedPaperId(paper.id);
      await queryClient.invalidateQueries({ queryKey: ["question-blueprints"] });
      await queryClient.invalidateQueries({ queryKey: ["question-blueprint"] });
      await queryClient.invalidateQueries({
        queryKey: ["question-blueprint-preview-summary"],
      });
      await queryClient.invalidateQueries({ queryKey: ["workspace-paper-detail"] });
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Failed to update paper status",
      );
    },
  });

  const deletePaperMutation = useMutation({
    mutationFn: async (paperId: string) => {
      const response = await blueprintApi.deletePaper(paperId);
      if (!response.ok) {
        throw new Error(response.message);
      }
      return response.data;
    },
    onSuccess: async (result) => {
      toast.success("Generated paper deleted");
      if (selectedPaperId === result.id) {
        setSelectedPaperId(null);
      }
      await queryClient.invalidateQueries({ queryKey: ["question-blueprints"] });
      await queryClient.invalidateQueries({ queryKey: ["question-blueprint"] });
      await queryClient.invalidateQueries({
        queryKey: ["question-blueprint-preview-summary"],
      });
      await queryClient.invalidateQueries({ queryKey: ["workspace-paper-detail"] });
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Failed to delete generated paper",
      );
    },
  });

  useEffect(() => {
    if (!selectedBlueprintId) {
      setMaterializeDraft(createMaterializeDraft());
      setSelectedPaperId(null);
      return;
    }
    if (detailQuery.data) {
      setMaterializeDraft(createMaterializeDraft(detailQuery.data.title));
    }
  }, [detailQuery.data, selectedBlueprintId]);

  const selectedPaperDetailQuery = useQuery({
    queryKey: ["workspace-paper-detail", selectedPaperId],
    queryFn: async () => {
      if (!selectedPaperId) {
        throw new Error("No paper selected.");
      }
      const response = await blueprintApi.getPaperDetail(selectedPaperId);
      if (!response.ok) {
        throw new Error(response.message);
      }
      return response.data;
    },
    enabled: Boolean(selectedPaperId),
  });

  const rows = blueprintsQuery.data?.rows ?? [];
  const overview = useMemo(() => {
    const readyCount = rows.filter((row) => row.status === "ready").length;
    const customCount = rows.filter((row) => row.mode === "custom").length;
    const issueCandidateCount = rows.filter(
      (row) => row.status !== "ready" && row.generatedPaperCount < 1,
    ).length;

    return { total: rows.length, readyCount, customCount, issueCandidateCount };
  }, [rows]);

  const errorMessage =
    (blueprintsQuery.error instanceof Error && blueprintsQuery.error.message) ||
    (detailQuery.error instanceof Error && detailQuery.error.message) ||
    (previewSummaryQuery.error instanceof Error && previewSummaryQuery.error.message) ||
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

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <BlueprintSummaryCard
          label="Total blueprints"
          value={overview.total}
          tone={summaryCardTone.total}
          icon={Layers3}
        />
        <BlueprintSummaryCard
          label="Ready to materialize"
          value={overview.readyCount}
          tone={summaryCardTone.ready}
          icon={CheckCircle2}
        />
        <BlueprintSummaryCard
          label="Custom mode"
          value={overview.customCount}
          tone={summaryCardTone.custom}
          icon={Orbit}
        />
        <BlueprintSummaryCard
          label="Needs setup"
          value={overview.issueCandidateCount}
          tone={summaryCardTone.issues}
          icon={FileWarning}
        />
      </div>

      <PagePanel className="space-y-4 bg-white/88">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div className="space-y-1">
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500">
              Exam engine
            </p>
            <h2 className="text-xl font-black tracking-tight text-slate-900">
              Paper blueprints
            </h2>
            <p className="max-w-2xl text-sm text-slate-600">
              Build exam rules by mode (MCQ only, All type, Custom), then preview readiness before generating papers.
            </p>
          </div>
          <div className="flex flex-col gap-3 md:items-end">
            <Button
              onClick={() => {
                void navigate({ to: ADMIN_ROUTES.questionBlueprintsNew });
              }}
            >
              New blueprint
            </Button>
          </div>
        </div>

        {blueprintsQuery.isLoading ? (
          <div className="flex items-center gap-2 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-10 text-sm text-slate-600">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading blueprint inventory...
          </div>
        ) : rows.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-10 text-center text-sm text-slate-600">
            No paper blueprints yet. Create your first blueprint to define section and slot rules.
          </div>
        ) : (
          <div className="space-y-3">
            {rows.map((row) => (
              <BlueprintRow
                key={row.id}
                row={row}
                onPreview={() => setSelectedBlueprintId(row.id)}
                onEdit={() => {
                  void navigate({
                    to: "/questions/blueprints/$blueprintId/edit",
                    params: { blueprintId: row.id },
                  });
                }}
                onDelete={() => {
                  if (
                    typeof window !== "undefined" &&
                    !window.confirm(`Delete blueprint "${row.title}"?`)
                  ) {
                    return;
                  }
                  deleteMutation.mutate(row.id);
                }}
                deleting={deleteMutation.isPending && deleteMutation.variables === row.id}
              />
            ))}
          </div>
        )}
      </PagePanel>


      <Dialog
        open={Boolean(selectedBlueprintId)}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedBlueprintId(null);
            setSelectedPaperId(null);
          }
        }}
      >
        <DialogContent className="max-h-[90vh] max-w-5xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Blueprint preview summary</DialogTitle>
            <DialogDescription>
              Server-side dry run for blueprint readiness, section coverage, and slot availability.
            </DialogDescription>
          </DialogHeader>

          {detailQuery.isLoading || previewSummaryQuery.isLoading ? (
            <div className="flex items-center gap-2 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-10 text-sm text-slate-600">
              <Loader2 className="h-4 w-4 animate-spin" />
              Building blueprint preview...
            </div>
          ) : detailQuery.data && previewSummaryQuery.data ? (
            <BlueprintPreviewContent
              detail={detailQuery.data}
              preview={previewSummaryQuery.data}
              materializeDraft={materializeDraft}
              onMaterializeDraftChange={setMaterializeDraft}
              onMaterialize={() => {
                if (!selectedBlueprintId) return;
                materializeMutation.mutate({
                  blueprintId: selectedBlueprintId,
                  input: buildMaterializeInput(materializeDraft),
                });
              }}
              materializing={materializeMutation.isPending}
              onOpenPaperDetail={(paperId) => setSelectedPaperId(paperId)}
              onTogglePaperStatus={(paperId, status) => {
                paperStatusMutation.mutate({ paperId, status });
              }}
              onDeletePaper={(paper) => {
                if (
                  typeof window !== "undefined" &&
                  !window.confirm(`Delete generated paper "${paper.title}"?`)
                ) {
                  return;
                }
                deletePaperMutation.mutate(paper.id);
              }}
              statusUpdatingPaperId={paperStatusMutation.variables?.paperId ?? null}
              deletingPaperId={deletePaperMutation.variables ?? null}
              paperStatusUpdating={paperStatusMutation.isPending}
              paperDeleting={deletePaperMutation.isPending}
            />
          ) : (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Preview not available</AlertTitle>
              <AlertDescription>
                {toErrorMessage(
                  detailQuery.error ?? previewSummaryQuery.error,
                  "The preview summary could not be loaded for this blueprint.",
                )}
              </AlertDescription>
            </Alert>
          )}
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(selectedPaperId)}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedPaperId(null);
          }
        }}
      >
        <DialogContent className="max-h-[85vh] max-w-4xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Generated paper details</DialogTitle>
            <DialogDescription>
              Review the generated question set and swap counters before export.
            </DialogDescription>
          </DialogHeader>

          {selectedPaperDetailQuery.isLoading ? (
            <div className="flex items-center gap-2 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-sm text-slate-600">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading paper details...
            </div>
          ) : selectedPaperDetailQuery.data ? (
            <div className="space-y-4">
              <PagePanel className="bg-slate-50/80">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h4 className="text-lg font-bold tracking-tight text-slate-900">
                      {selectedPaperDetailQuery.data.title}
                    </h4>
                    <p className="text-sm text-slate-600">
                      {selectedPaperDetailQuery.data.totalQuestions} questions •{" "}
                      {selectedPaperDetailQuery.data.totalMarks} marks
                    </p>
                  </div>
                  <Badge
                    variant="outline"
                    className={cn(
                      selectedPaperDetailQuery.data.status === "finalized"
                        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                        : "border-slate-200 bg-white text-slate-700",
                    )}
                  >
                    {selectedPaperDetailQuery.data.status}
                  </Badge>
                </div>
                <p className="text-xs text-slate-500">
                  Updated {formatBlueprintDateTime(selectedPaperDetailQuery.data.updatedAt)}
                </p>
              </PagePanel>

              <PagePanel className="space-y-3 bg-white/92">
                <h4 className="text-lg font-bold tracking-tight text-slate-900">Question items</h4>
                <div className="space-y-2">
                  {selectedPaperDetailQuery.data.items.map((item) => (
                    <div
                      key={item.id}
                      className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold text-slate-900">
                          #{item.position} {item.questionCode}
                        </p>
                        <Badge
                          variant="outline"
                          className="border-slate-200 bg-white text-slate-700"
                        >
                          {item.questionType}
                        </Badge>
                        <Badge
                          variant="outline"
                          className="border-slate-200 bg-white text-slate-700"
                        >
                          {item.marks} marks
                        </Badge>
                        <Badge
                          variant="outline"
                          className="border-slate-200 bg-white text-slate-700"
                        >
                          swaps {item.swapCount}/{item.swapLimit}
                        </Badge>
                      </div>
                      <p className="mt-2 text-sm text-slate-600">
                        {toPlainBlueprintPreview(item.body, 220)}
                      </p>
                    </div>
                  ))}
                </div>
              </PagePanel>
            </div>
          ) : (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Paper detail not available</AlertTitle>
              <AlertDescription>
                This generated paper could not be loaded.
              </AlertDescription>
            </Alert>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export function BlueprintBuilderPage({ blueprintId }: { blueprintId?: string }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEditing = Boolean(blueprintId);
  const [wizardStep, setWizardStep] = useState<BlueprintWizardStep>("setup");
  const [draft, setDraft] = useState<BlueprintFormDraft>(createEmptyDraft);
  const [lockedPickerOpen, setLockedPickerOpen] = useState(false);
  const [lockedPickerSlotIndex, setLockedPickerSlotIndex] = useState<number | null>(null);
  const [lockedPickerSearch, setLockedPickerSearch] = useState("");

  const metaQuery = useQuery({
    queryKey: ["question-meta"],
    queryFn: async () => {
      const response = await questionApi.getMeta();
      if (!response.ok) {
        throw new Error(response.message);
      }
      return response.data;
    },
  });

  const editingDetailQuery = useQuery({
    queryKey: ["question-blueprint-edit", blueprintId],
    queryFn: async () => {
      if (!blueprintId) {
        throw new Error("No blueprint selected.");
      }
      const response = await blueprintApi.getBlueprint(blueprintId);
      if (!response.ok) {
        throw new Error(response.message);
      }
      return response.data;
    },
    enabled: Boolean(blueprintId),
  });

  const saveMutation = useMutation({
    mutationFn: async (input: PaperBlueprintSubmitInput) => {
      const response = blueprintId
        ? await blueprintApi.updateBlueprint(blueprintId, input)
        : await blueprintApi.createBlueprint(input);
      if (!response.ok) {
        throw new Error(response.message);
      }
      return response.data;
    },
    onSuccess: async () => {
      toast.success(blueprintId ? "Blueprint updated" : "Blueprint created");
      await queryClient.invalidateQueries({ queryKey: ["question-blueprints"] });
      await queryClient.invalidateQueries({ queryKey: ["question-blueprint"] });
      await queryClient.invalidateQueries({ queryKey: ["question-blueprint-edit"] });
      await queryClient.invalidateQueries({
        queryKey: ["question-blueprint-preview-summary"],
      });
      await navigate({ to: ADMIN_ROUTES.questionBlueprints });
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Failed to save blueprint");
    },
  });

  useEffect(() => {
    if (!isEditing) {
      setDraft(createEmptyDraft());
      return;
    }
    if (editingDetailQuery.data) {
      setDraft(detailToDraft(editingDetailQuery.data));
    }
  }, [editingDetailQuery.data, isEditing]);

  const subjects = useMemo(
    () => getSubjectsForGrade(metaQuery.data, draft.gradeId),
    [metaQuery.data, draft.gradeId],
  );
  const chapters = useMemo(
    () => getChaptersForSelection(metaQuery.data, draft.gradeId, draft.subjectId),
    [metaQuery.data, draft.gradeId, draft.subjectId],
  );
  const subChapters = useMemo(
    () => getSubChaptersForSelectedChapters(metaQuery.data, draft.presetChapterIds),
    [metaQuery.data, draft.presetChapterIds],
  );
  const parsedSections = useMemo(() => {
    try {
      return parseJsonArray<PaperBlueprintSectionInput>("Sections", draft.sectionsJson);
    } catch {
      return [];
    }
  }, [draft.sectionsJson]);
  const parsedSlots = useMemo(() => {
    try {
      return parseJsonArray<PaperBlueprintSlotInput>("Slots", draft.slotsJson);
    } catch {
      return [];
    }
  }, [draft.slotsJson]);
  const sectionsJsonError = useMemo(() => {
    try {
      parseJsonArray<PaperBlueprintSectionInput>("Sections", draft.sectionsJson);
      return null;
    } catch (error) {
      return error instanceof Error ? error.message : "Invalid sections JSON";
    }
  }, [draft.sectionsJson]);
  const slotsJsonError = useMemo(() => {
    try {
      parseJsonArray<PaperBlueprintSlotInput>("Slots", draft.slotsJson);
      return null;
    } catch (error) {
      return error instanceof Error ? error.message : "Invalid slots JSON";
    }
  }, [draft.slotsJson]);
  const difficultyTotal =
    Number(draft.difficultyDistribution.easy || 0) +
    Number(draft.difficultyDistribution.normal || 0) +
    Number(draft.difficultyDistribution.hard || 0) +
    Number(draft.difficultyDistribution.advance || 0);
  const hardAdvanceTotal =
    Number(draft.difficultyDistribution.hard || 0) +
    Number(draft.difficultyDistribution.advance || 0);
  const hasValidDifficulty = difficultyTotal === 100 && hardAdvanceTotal <= 30;
  const setupStepReady =
    draft.title.trim().length > 0 &&
    draft.gradeId.trim().length > 0 &&
    draft.subjectId.trim().length > 0 &&
    Number(draft.totalMarks) > 0;
  const sectionsHaveCodes =
    parsedSections.length === 0 ||
    parsedSections.every((section) => section.code.trim().length > 0);
  const structureStepReady =
    !sectionsJsonError &&
    !slotsJsonError &&
    (draft.mode === "mcq_only" ||
      (draft.mode === "all_type" && parsedSections.length > 0 && sectionsHaveCodes) ||
      (draft.mode === "custom" &&
        parsedSections.length > 0 &&
        parsedSlots.length > 0 &&
        sectionsHaveCodes));
  const canSaveBlueprint =
    setupStepReady &&
    hasValidDifficulty &&
    structureStepReady;
  const stepAvailability: Record<BlueprintWizardStep, boolean> = {
    setup: true,
    filters: setupStepReady,
    structure: setupStepReady && hasValidDifficulty,
    review: setupStepReady && hasValidDifficulty && structureStepReady,
  };
  const currentStepIndex = blueprintWizardSteps.findIndex((step) => step.key === wizardStep);
  const showSectionBuilder = draft.mode !== "mcq_only";
  const showSlotBuilder = draft.mode === "custom";

  const syncSections = (
    updater: (current: PaperBlueprintSectionInput[]) => PaperBlueprintSectionInput[],
  ) => {
    setDraft((current) => {
      const nextSections = updater(
        parseJsonArray<PaperBlueprintSectionInput>("Sections", current.sectionsJson),
      );
      return {
        ...current,
        sectionsJson: JSON.stringify(nextSections, null, 2),
      };
    });
  };

  const syncSlots = (
    updater: (current: PaperBlueprintSlotInput[]) => PaperBlueprintSlotInput[],
  ) => {
    setDraft((current) => {
      const nextSlots = updater(
        parseJsonArray<PaperBlueprintSlotInput>("Slots", current.slotsJson),
      );
      return {
        ...current,
        slotsJson: JSON.stringify(nextSlots, null, 2),
      };
    });
  };

  const applyBlueprintPreset = (mode: "all_type" | "custom") => {
    const hasExistingRules =
      hasJsonContent(draft.sectionsJson) || hasJsonContent(draft.slotsJson);
    if (
      hasExistingRules &&
      typeof window !== "undefined" &&
      !window.confirm("Apply preset and replace current sections/slots configuration?")
    ) {
      return;
    }

    const sections =
      mode === "all_type" ? createAllTypePresetSections() : createCustomPresetSections();
    const slots = mode === "custom" ? createCustomPresetSlots(sections) : [];

    setDraft((current) => ({
      ...current,
      mode,
      totalMarks: String(getSectionTotalMarks(sections)),
      sectionsJson: JSON.stringify(sections, null, 2),
      slotsJson: JSON.stringify(slots, null, 2),
    }));
    toast.success(mode === "all_type" ? "All-type preset applied" : "Custom preset applied");
  };

  const goToStep = (step: BlueprintWizardStep) => {
    if (stepAvailability[step]) {
      setWizardStep(step);
    }
  };

  const goToNextStep = () => {
    if (wizardStep === "setup" && !setupStepReady) {
      toast.error("Complete title, grade, subject, and total marks first.");
      return;
    }
    if (wizardStep === "filters" && !hasValidDifficulty) {
      toast.error("Difficulty distribution must total 100% and keep hard + advance at 30% or less.");
      return;
    }
    if (wizardStep === "structure" && !structureStepReady) {
      toast.error("Complete the required section or slot structure before review.");
      return;
    }

    const nextStep = blueprintWizardSteps[currentStepIndex + 1];
    if (nextStep) {
      setWizardStep(nextStep.key);
    }
  };

  const goToPreviousStep = () => {
    const previousStep = blueprintWizardSteps[currentStepIndex - 1];
    if (previousStep) {
      setWizardStep(previousStep.key);
    }
  };

  const lockedPickerSlot =
    typeof lockedPickerSlotIndex === "number" ? parsedSlots[lockedPickerSlotIndex] : undefined;
  const lockedPickerSlotSubChapters = useMemo(
    () => getSubChaptersForSingleChapter(metaQuery.data, lockedPickerSlot?.chapterId ?? ""),
    [metaQuery.data, lockedPickerSlot?.chapterId],
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
      if (!lockedPickerSlot || !draft.gradeId || !draft.subjectId) {
        return [] as QuestionRecord[];
      }
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
      if (!response.ok) {
        throw new Error(response.message);
      }
      return response.data.rows.filter((row) => row.marks === lockedPickerSlot.marks);
    },
    enabled:
      lockedPickerOpen &&
      Boolean(lockedPickerSlot) &&
      Boolean(draft.gradeId) &&
      Boolean(draft.subjectId),
  });

  const errorMessage =
    (metaQuery.error instanceof Error && metaQuery.error.message) ||
    (editingDetailQuery.error instanceof Error && editingDetailQuery.error.message) ||
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
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-1">
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500">
              Blueprint builder
            </p>
            <h2 className="text-2xl font-black tracking-tight text-slate-900">
              {isEditing ? "Edit blueprint" : "New blueprint"}
            </h2>
            <p className="text-sm text-slate-600">
              Full-page builder for setup, difficulty, structure, and final review.
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => void navigate({ to: ADMIN_ROUTES.questionBlueprints })}
            >
              Back to list
            </Button>
            <Badge variant="outline" className={blueprintStatusTone[draft.status]}>
              {blueprintStatusLabel[draft.status]}
            </Badge>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-4">
          {blueprintWizardSteps.map((step, index) => {
            const active = wizardStep === step.key;
            const enabled = stepAvailability[step.key];
            return (
              <button
                key={step.key}
                type="button"
                className={cn(
                  "rounded-2xl border px-4 py-3 text-left transition",
                  active
                    ? "border-slate-900 bg-slate-900 text-white"
                    : enabled
                      ? "border-slate-200 bg-white text-slate-900"
                      : "border-slate-200 bg-slate-50 text-slate-400",
                )}
                disabled={!enabled}
                onClick={() => goToStep(step.key)}
              >
                <p className="text-[11px] font-bold uppercase tracking-[0.16em] opacity-70">
                  Step {index + 1}
                </p>
                <p className="mt-1 text-sm font-semibold">{step.label}</p>
                <p className="mt-1 text-xs opacity-80">{step.description}</p>
              </button>
            );
          })}
        </div>

        <div className="rounded-2xl border border-sky-200 bg-sky-50/80 px-4 py-3">
          <p className="text-sm font-semibold text-sky-950">{modeGuidance[draft.mode].title}</p>
          <p className="mt-1 text-xs text-sky-800">{modeGuidance[draft.mode].description}</p>
        </div>

        {wizardStep === "setup" ? (
          <div className="space-y-4">
            <div className="grid gap-4 lg:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="blueprint-title-page">Title</Label>
                <Input
                  id="blueprint-title-page"
                  value={draft.title}
                  onChange={(event) =>
                    setDraft((current) => ({ ...current, title: event.target.value }))
                  }
                  placeholder="Grade 12 Midterm Blueprint A"
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label>Mode</Label>
                  <Select
                    value={draft.mode}
                    onValueChange={(value) =>
                      setDraft((current) => ({
                        ...current,
                        mode: value as PaperBlueprintMode,
                      }))
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mcq_only">MCQ only</SelectItem>
                      <SelectItem value="all_type">All type</SelectItem>
                      <SelectItem value="custom">Custom</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select
                    value={draft.status}
                    onValueChange={(value) =>
                      setDraft((current) => ({
                        ...current,
                        status:
                          current.publishToUsers && value !== "ready"
                            ? "ready"
                            : (value as PaperBlueprintStatus),
                      }))
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="ready">Ready</SelectItem>
                      <SelectItem value="archived" disabled={draft.publishToUsers}>
                        Archived
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Total marks</Label>
                  <Input
                    type="number"
                    min={1}
                    value={draft.totalMarks}
                    onChange={(event) =>
                      setDraft((current) => ({
                        ...current,
                        totalMarks: event.target.value,
                      }))
                    }
                  />
                </div>
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <div className="space-y-2">
                <Label>Grade</Label>
                <Select
                  value={draft.gradeId || "__none__"}
                  onValueChange={(value) =>
                    setDraft((current) => ({
                      ...current,
                      gradeId: value === "__none__" ? "" : value,
                      subjectId: "",
                      presetChapterIds: [],
                      presetSubChapterIds: [],
                    }))
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a grade" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">Select a grade</SelectItem>
                    {(metaQuery.data?.grades ?? []).map((grade) => (
                      <SelectItem key={grade.id} value={grade.id}>
                        {grade.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Subject</Label>
                <Select
                  value={draft.subjectId || "__none__"}
                  onValueChange={(value) =>
                    setDraft((current) => ({
                      ...current,
                      subjectId: value === "__none__" ? "" : value,
                      presetChapterIds: [],
                      presetSubChapterIds: [],
                    }))
                  }
                  disabled={!draft.gradeId}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a subject" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">Select a subject</SelectItem>
                    {subjects.map((subject) => (
                      <SelectItem key={subject.id} value={subject.id}>
                        {subject.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <PagePanel className="space-y-4 bg-slate-50/80">
              <div className="space-y-1">
                <h3 className="text-base font-bold tracking-tight text-slate-900">PDF style</h3>
                <p className="text-sm text-slate-500">
                  Keep this generic for most subjects, or switch to Myanmar Matric when you want formal exam-paper formatting.
                </p>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                {pdfTemplateOptions.map((option) => {
                  const active = draft.pdfTemplateKey === option.value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      className={cn(
                        "rounded-2xl border px-4 py-4 text-left transition",
                        active
                          ? "border-slate-900 bg-slate-900 text-white"
                          : "border-slate-200 bg-white text-slate-900 hover:border-slate-300",
                      )}
                      onClick={() =>
                        setDraft((current) => ({
                          ...current,
                          pdfTemplateKey: option.value,
                          timeAllowedLabel:
                            option.value === "myanmar_matric" && !current.timeAllowedLabel.trim()
                              ? "(3) Hours"
                              : current.timeAllowedLabel,
                          departmentLine:
                            option.value === "myanmar_matric" && !current.departmentLine.trim()
                              ? "DEPARTMENT OF MYANMAR EXAMINATION"
                              : current.departmentLine,
                          answerInstructionLine:
                            option.value === "myanmar_matric" &&
                            !current.answerInstructionLine.trim()
                              ? "WRITE YOUR ANSWERS IN THE ANSWER BOOKLET."
                              : current.answerInstructionLine,
                        }))
                      }
                    >
                      <p className="text-sm font-semibold">{option.label}</p>
                      <p className={cn("mt-1 text-xs", active ? "text-slate-200" : "text-slate-500")}>
                        {option.description}
                      </p>
                    </button>
                  );
                })}
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="blueprint-exam-year">Exam year label</Label>
                  <Input
                    id="blueprint-exam-year"
                    value={draft.examYearLabel}
                    onChange={(event) =>
                      setDraft((current) => ({
                        ...current,
                        examYearLabel: event.target.value,
                      }))
                    }
                    placeholder={draft.pdfTemplateKey === "myanmar_matric" ? "2020" : "Optional"}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="blueprint-time-allowed">Time allowed</Label>
                  <Input
                    id="blueprint-time-allowed"
                    value={draft.timeAllowedLabel}
                    onChange={(event) =>
                      setDraft((current) => ({
                        ...current,
                        timeAllowedLabel: event.target.value,
                      }))
                    }
                    placeholder={draft.pdfTemplateKey === "myanmar_matric" ? "(3) Hours" : "Optional"}
                  />
                </div>
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="blueprint-department-line">Department line</Label>
                  <Input
                    id="blueprint-department-line"
                    value={draft.departmentLine}
                    onChange={(event) =>
                      setDraft((current) => ({
                        ...current,
                        departmentLine: event.target.value,
                      }))
                    }
                    placeholder={
                      draft.pdfTemplateKey === "myanmar_matric"
                        ? "DEPARTMENT OF MYANMAR EXAMINATION"
                        : "Optional"
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="blueprint-answer-instruction">Instruction line</Label>
                  <Input
                    id="blueprint-answer-instruction"
                    value={draft.answerInstructionLine}
                    onChange={(event) =>
                      setDraft((current) => ({
                        ...current,
                        answerInstructionLine: event.target.value,
                      }))
                    }
                    placeholder={
                      draft.pdfTemplateKey === "myanmar_matric"
                        ? "WRITE YOUR ANSWERS IN THE ANSWER BOOKLET."
                        : "Optional"
                    }
                  />
                </div>
              </div>
            </PagePanel>
          </div>
        ) : null}

        {wizardStep === "filters" ? (
          <div className="space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-900">Difficulty distribution</p>
                  <p className="text-xs text-slate-500">
                    Must total 100%. Hard + advance must stay at 30% or below.
                  </p>
                </div>
                <div className="text-right text-xs text-slate-500">
                  <p>Total: {difficultyTotal}%</p>
                  <p>Hard + advance: {hardAdvanceTotal}%</p>
                </div>
              </div>
              <div className="mb-4 flex flex-wrap gap-2">
                {difficultyPresets.map((preset) => {
                  const isActive = (
                    Object.keys(preset.values) as Array<keyof typeof preset.values>
                  ).every(
                    (bucket) => draft.difficultyDistribution[bucket] === preset.values[bucket],
                  );
                  return (
                    <Button
                      key={preset.key}
                      type="button"
                      variant="outline"
                      className={cn(
                        "rounded-full bg-white",
                        isActive
                          ? "border-slate-900 bg-slate-900 text-white hover:bg-slate-900 hover:text-white"
                          : "border-slate-200 text-slate-700 hover:bg-slate-100",
                      )}
                      onClick={() =>
                        setDraft((current) => ({
                          ...current,
                          difficultyDistribution: { ...preset.values },
                        }))
                      }
                    >
                      {preset.label}
                    </Button>
                  );
                })}
              </div>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {(Object.keys(draft.difficultyDistribution) as Array<
                  keyof BlueprintFormDraft["difficultyDistribution"]
                >).map((bucket) => (
                  <div key={bucket} className="space-y-2">
                    <Label className="capitalize">{bucket}</Label>
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      value={draft.difficultyDistribution[bucket]}
                      onChange={(event) =>
                        setDraft((current) => ({
                          ...current,
                          difficultyDistribution: {
                            ...current.difficultyDistribution,
                            [bucket]: event.target.value,
                          },
                        }))
                      }
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="grid gap-4 xl:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <div className="mb-3">
                  <p className="text-sm font-semibold text-slate-900">Preset chapters</p>
                  <p className="text-xs text-slate-500">
                    Optional filter for auto-generated sections.
                  </p>
                </div>
                <div className="max-h-60 space-y-2 overflow-y-auto">
                  {chapters.length === 0 ? (
                    <p className="text-sm text-slate-500">Pick grade and subject first.</p>
                  ) : (
                    chapters.map((chapter) => {
                      const checked = draft.presetChapterIds.includes(chapter.id);
                      return (
                        <label
                          key={chapter.id}
                          className="flex items-start gap-3 rounded-xl border border-slate-200 px-3 py-2 text-sm"
                        >
                          <Checkbox
                            checked={checked}
                            onCheckedChange={(nextChecked) =>
                              setDraft((current) => {
                                const nextChapterIds = nextChecked
                                  ? [...current.presetChapterIds, chapter.id]
                                  : current.presetChapterIds.filter((id) => id !== chapter.id);
                                const allowedSubChapters = new Set(
                                  getSubChaptersForSelectedChapters(
                                    metaQuery.data,
                                    nextChapterIds,
                                  ).map((item) => item.id),
                                );
                                return {
                                  ...current,
                                  presetChapterIds: nextChapterIds,
                                  presetSubChapterIds: current.presetSubChapterIds.filter((id) =>
                                    allowedSubChapters.has(id),
                                  ),
                                };
                              })
                            }
                          />
                          <span>
                            <span className="block font-medium text-slate-900">{chapter.name}</span>
                            <span className="text-xs text-slate-500">{chapter.code ?? "No code"}</span>
                          </span>
                        </label>
                      );
                    })
                  )}
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <div className="mb-3">
                  <p className="text-sm font-semibold text-slate-900">Preset lessons</p>
                  <p className="text-xs text-slate-500">Optional lesson filter inside selected chapters.</p>
                </div>
                <div className="max-h-60 space-y-2 overflow-y-auto">
                  {subChapters.length === 0 ? (
                    <p className="text-sm text-slate-500">Select one or more chapters first.</p>
                  ) : (
                    subChapters.map((subChapter) => {
                      const checked = draft.presetSubChapterIds.includes(subChapter.id);
                      return (
                        <label
                          key={subChapter.id}
                          className="flex items-start gap-3 rounded-xl border border-slate-200 px-3 py-2 text-sm"
                        >
                          <Checkbox
                            checked={checked}
                            onCheckedChange={(nextChecked) =>
                              setDraft((current) => ({
                                ...current,
                                presetSubChapterIds: nextChecked
                                  ? [...current.presetSubChapterIds, subChapter.id]
                                  : current.presetSubChapterIds.filter((id) => id !== subChapter.id),
                              }))
                            }
                          />
                          <span>
                            <span className="block font-medium text-slate-900">{subChapter.name}</span>
                            <span className="text-xs text-slate-500">{subChapter.code ?? "No code"}</span>
                          </span>
                        </label>
                      );
                    })
                  )}
                </div>
              </div>
            </div>

            <div className="grid gap-4 xl:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <label className="flex items-start gap-3 text-sm">
                  <Checkbox
                    checked={draft.includeAnswerPaper}
                    onCheckedChange={(checked) =>
                      setDraft((current) => ({
                        ...current,
                        includeAnswerPaper: checked === true,
                      }))
                    }
                  />
                  <span>
                    <span className="block font-medium text-slate-900">Include answer paper by default</span>
                    <span className="text-xs text-slate-500">
                      Materialized papers will request question + answer output together.
                    </span>
                  </span>
                </label>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <label className="flex items-start gap-3 text-sm">
                  <Checkbox
                    checked={draft.publishToUsers}
                    onCheckedChange={(checked) =>
                      setDraft((current) => ({
                        ...current,
                        publishToUsers: checked === true,
                        status:
                          checked === true && current.status !== "ready" ? "ready" : current.status,
                        availablePlanCodes: checked === true ? current.availablePlanCodes : [],
                      }))
                    }
                  />
                  <span>
                    <span className="block font-medium text-slate-900">Publish as reusable template</span>
                    <span className="text-xs text-slate-500">
                      Users will see this as a ready-made template.
                    </span>
                  </span>
                </label>

                {draft.publishToUsers ? (
                  <div className="mt-4 space-y-3">
                    <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-900">
                      Published templates are forced to <span className="font-semibold">Ready</span> status.
                    </div>
                    <div className="grid gap-2 md:grid-cols-3">
                      {planOptions.map((plan) => {
                        const checked = draft.availablePlanCodes.includes(plan.value);
                        return (
                          <label
                            key={plan.value}
                            className="flex items-start gap-3 rounded-xl border border-slate-200 px-3 py-3 text-sm"
                          >
                            <Checkbox
                              checked={checked}
                              onCheckedChange={(nextChecked) =>
                                setDraft((current) => ({
                                  ...current,
                                  availablePlanCodes: nextChecked
                                    ? [...new Set([...current.availablePlanCodes, plan.value])]
                                    : current.availablePlanCodes.filter((value) => value !== plan.value),
                                }))
                              }
                            />
                            <span>
                              <span className="block font-medium text-slate-900">{plan.label}</span>
                              <span className="text-xs text-slate-500">{plan.description}</span>
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        ) : null}

        {wizardStep === "structure" ? (
          <div className="space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-900">Quick presets</p>
                  <p className="text-xs text-slate-500">Start from a ready structure, then adjust visually.</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button type="button" variant="outline" onClick={() => applyBlueprintPreset("all_type")}>
                    Apply all-type preset
                  </Button>
                  <Button type="button" variant="outline" onClick={() => applyBlueprintPreset("custom")}>
                    Apply custom preset
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() =>
                      setDraft((current) => ({
                        ...current,
                        sectionsJson: EMPTY_SECTIONS_JSON,
                        slotsJson: EMPTY_SLOTS_JSON,
                      }))
                    }
                  >
                    Clear rules
                  </Button>
                </div>
              </div>
            </div>

            {showSectionBuilder ? (
              <PagePanel className="space-y-4 bg-white/92">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-bold tracking-tight text-slate-900">Sections</h3>
                    <p className="text-sm text-slate-500">Define the paper groups first.</p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() =>
                      syncSections((current) => [
                        ...current,
                        {
                          code: String.fromCharCode(65 + current.length),
                          title: `Section ${String.fromCharCode(65 + current.length)}`,
                          questionType: "mcq",
                          marksPerQuestion: 1,
                          questionCount: 1,
                          totalMarks: 1,
                          sortOrder: current.length + 1,
                        },
                      ])
                    }
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add section
                  </Button>
                </div>

                {parsedSections.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-sm text-slate-500">
                    No sections yet. Add one or apply a preset.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {parsedSections.map((section, index) => (
                      <div key={`${section.code}-${index}`} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                        <div className="mb-3 flex items-center justify-between gap-3">
                          <p className="text-sm font-semibold text-slate-900">Section {index + 1}</p>
                          <Button
                            type="button"
                            variant="outline"
                            className="border-rose-200 text-rose-700 hover:bg-rose-50 hover:text-rose-800"
                            onClick={() =>
                              syncSections((current) => current.filter((_, itemIndex) => itemIndex !== index))
                            }
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Remove
                          </Button>
                        </div>
                        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
                          <div className="space-y-2">
                            <Label>Code</Label>
                            <Input
                              value={section.code}
                              onChange={(event) =>
                                syncSections((current) =>
                                  current.map((item, itemIndex) =>
                                    itemIndex === index ? { ...item, code: event.target.value } : item,
                                  ),
                                )
                              }
                            />
                          </div>
                          <div className="space-y-2 xl:col-span-2">
                            <Label>Title</Label>
                            <Input
                              value={section.title ?? ""}
                              onChange={(event) =>
                                syncSections((current) =>
                                  current.map((item, itemIndex) =>
                                    itemIndex === index ? { ...item, title: event.target.value } : item,
                                  ),
                                )
                              }
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Type</Label>
                            <Select
                              value={section.questionType ?? "mcq"}
                              onValueChange={(value) =>
                                syncSections((current) =>
                                  current.map((item, itemIndex) =>
                                    itemIndex === index
                                      ? { ...item, questionType: value as PaperBlueprintQuestionType }
                                      : item,
                                  ),
                                )
                              }
                            >
                              <SelectTrigger className="w-full">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {questionTypeOptions.map((option) => (
                                  <SelectItem key={option.value} value={option.value}>
                                    {option.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label>Marks each</Label>
                            <Select
                              value={String(section.marksPerQuestion ?? 1)}
                              onValueChange={(value) =>
                                syncSections((current) =>
                                  current.map((item, itemIndex) => {
                                    if (itemIndex !== index) return item;
                                    const marks = Number(value) as 1 | 2 | 3 | 5 | 10;
                                    return {
                                      ...item,
                                      marksPerQuestion: marks,
                                      totalMarks: marks * item.questionCount,
                                    };
                                  }),
                                )
                              }
                            >
                              <SelectTrigger className="w-full">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {markOptions.map((mark) => (
                                  <SelectItem key={mark} value={String(mark)}>
                                    {mark}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label>Question count</Label>
                            <Input
                              type="number"
                              min={1}
                              value={section.questionCount}
                              onChange={(event) =>
                                syncSections((current) =>
                                  current.map((item, itemIndex) => {
                                    if (itemIndex !== index) return item;
                                    const questionCount = Math.max(1, Number(event.target.value || 1));
                                    const marksPerQuestion = item.marksPerQuestion ?? 1;
                                    return {
                                      ...item,
                                      questionCount,
                                      totalMarks: marksPerQuestion * questionCount,
                                    };
                                  }),
                                )
                              }
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </PagePanel>
            ) : null}

            {showSlotBuilder ? (
              <PagePanel className="space-y-4 bg-white/92">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-bold tracking-tight text-slate-900">Slots</h3>
                    <p className="text-sm text-slate-500">Define exact slot targets for custom papers.</p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() =>
                      syncSlots((current) => [
                        ...current,
                        {
                          slotNumber: current.length + 1,
                          sectionCode: parsedSections[0]?.code,
                          questionType: "mcq",
                          marks: 1,
                          swapLimit: 3,
                        },
                      ])
                    }
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add slot
                  </Button>
                </div>

                {parsedSlots.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-sm text-slate-500">
                    No slots yet. Add one or apply the custom preset.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {parsedSlots.map((slot, index) => {
                      const slotSubChapters = getSubChaptersForSingleChapter(metaQuery.data, slot.chapterId ?? "");
                      return (
                        <div key={`${slot.slotNumber}-${index}`} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                          <div className="mb-3 flex items-center justify-between gap-3">
                            <p className="text-sm font-semibold text-slate-900">Slot {slot.slotNumber}</p>
                            <Button
                              type="button"
                              variant="outline"
                              className="border-rose-200 text-rose-700 hover:bg-rose-50 hover:text-rose-800"
                              onClick={() =>
                                syncSlots((current) => current.filter((_, itemIndex) => itemIndex !== index))
                              }
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Remove
                            </Button>
                          </div>
                          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
                            <div className="space-y-2">
                              <Label>Slot no.</Label>
                              <Input
                                type="number"
                                min={1}
                                value={slot.slotNumber}
                                onChange={(event) =>
                                  syncSlots((current) =>
                                    current.map((item, itemIndex) =>
                                      itemIndex === index
                                        ? { ...item, slotNumber: Math.max(1, Number(event.target.value || 1)) }
                                        : item,
                                    ),
                                  )
                                }
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Section</Label>
                              <Select
                                value={slot.sectionCode ?? "__none__"}
                                onValueChange={(value) =>
                                  syncSlots((current) =>
                                    current.map((item, itemIndex) =>
                                      itemIndex === index
                                        ? { ...item, sectionCode: value === "__none__" ? undefined : value }
                                        : item,
                                    ),
                                  )
                                }
                              >
                                <SelectTrigger className="w-full">
                                  <SelectValue placeholder="Optional" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="__none__">Optional</SelectItem>
                                  {parsedSections.map((section) => (
                                    <SelectItem key={section.code} value={section.code}>
                                      {section.code}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-2">
                              <Label>Type</Label>
                              <Select
                                value={slot.questionType}
                                onValueChange={(value) =>
                                  syncSlots((current) =>
                                    current.map((item, itemIndex) =>
                                      itemIndex === index
                                        ? { ...item, questionType: value as PaperBlueprintQuestionType }
                                        : item,
                                    ),
                                  )
                                }
                              >
                                <SelectTrigger className="w-full">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {questionTypeOptions.map((option) => (
                                    <SelectItem key={option.value} value={option.value}>
                                      {option.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-2">
                              <Label>Marks</Label>
                              <Select
                                value={String(slot.marks)}
                                onValueChange={(value) =>
                                  syncSlots((current) =>
                                    current.map((item, itemIndex) =>
                                      itemIndex === index ? { ...item, marks: Number(value) as 1 | 2 | 3 | 5 | 10 } : item,
                                    ),
                                  )
                                }
                              >
                                <SelectTrigger className="w-full">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {markOptions.map((mark) => (
                                    <SelectItem key={mark} value={String(mark)}>
                                      {mark}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-2">
                              <Label>Difficulty</Label>
                              <Select
                                value={slot.difficultyTarget ?? "__none__"}
                                onValueChange={(value) =>
                                  syncSlots((current) =>
                                    current.map((item, itemIndex) =>
                                      itemIndex === index
                                        ? {
                                            ...item,
                                            difficultyTarget:
                                              value === "__none__"
                                                ? undefined
                                                : (value as PaperBlueprintDifficulty),
                                          }
                                        : item,
                                    ),
                                  )
                                }
                              >
                                <SelectTrigger className="w-full">
                                  <SelectValue placeholder="Optional" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="__none__">Optional</SelectItem>
                                  {difficultyOptions.map((option) => (
                                    <SelectItem key={option.value} value={option.value}>
                                      {option.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-2">
                              <Label>Swap limit</Label>
                              <Input
                                type="number"
                                min={1}
                                max={10}
                                value={slot.swapLimit ?? 3}
                                onChange={(event) =>
                                  syncSlots((current) =>
                                    current.map((item, itemIndex) =>
                                      itemIndex === index
                                        ? {
                                            ...item,
                                            swapLimit: Math.min(10, Math.max(1, Number(event.target.value || 3))),
                                          }
                                        : item,
                                    ),
                                  )
                                }
                              />
                            </div>
                          </div>

                          <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                            <div className="space-y-2">
                              <Label>Chapter</Label>
                              <Select
                                value={slot.chapterId ?? "__none__"}
                                onValueChange={(value) =>
                                  syncSlots((current) =>
                                    current.map((item, itemIndex) =>
                                      itemIndex === index
                                        ? {
                                            ...item,
                                            chapterId: value === "__none__" ? undefined : value,
                                            subChapterId: undefined,
                                          }
                                        : item,
                                    ),
                                  )
                                }
                              >
                                <SelectTrigger className="w-full">
                                  <SelectValue placeholder="Optional" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="__none__">Optional</SelectItem>
                                  {chapters.map((chapter) => (
                                    <SelectItem key={chapter.id} value={chapter.id}>
                                      {chapter.code ? `${chapter.code} · ${chapter.name}` : chapter.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-2">
                              <Label>Lesson</Label>
                              <Select
                                value={slot.subChapterId ?? "__none__"}
                                onValueChange={(value) =>
                                  syncSlots((current) =>
                                    current.map((item, itemIndex) =>
                                      itemIndex === index
                                        ? { ...item, subChapterId: value === "__none__" ? undefined : value }
                                        : item,
                                    ),
                                  )
                                }
                                disabled={!slot.chapterId}
                              >
                                <SelectTrigger className="w-full">
                                  <SelectValue placeholder="Optional" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="__none__">Optional</SelectItem>
                                  {slotSubChapters.map((subChapter) => (
                                    <SelectItem key={subChapter.id} value={subChapter.id}>
                                      {subChapter.code ? `${subChapter.code} · ${subChapter.name}` : subChapter.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-2">
                              <Label>Locked question</Label>
                              <div className="space-y-2 rounded-xl border border-slate-200 bg-white p-3">
                                <Input
                                  value={slot.lockedQuestionId ?? ""}
                                  onChange={(event) =>
                                    syncSlots((current) =>
                                      current.map((item, itemIndex) =>
                                        itemIndex === index
                                          ? { ...item, lockedQuestionId: event.target.value.trim() || undefined }
                                          : item,
                                      ),
                                    )
                                  }
                                  placeholder="Optional published question id"
                                />
                                <div className="flex flex-wrap items-center gap-2">
                                  <Button
                                    type="button"
                                    variant="outline"
                                    className="border-slate-300/80 bg-white"
                                    onClick={() => {
                                      if (!draft.gradeId || !draft.subjectId) {
                                        toast.error("Select grade and subject first.");
                                        return;
                                      }
                                      setLockedPickerSlotIndex(index);
                                      setLockedPickerSearch("");
                                      setLockedPickerOpen(true);
                                    }}
                                  >
                                    <Search className="mr-2 h-4 w-4" />
                                    Pick question
                                  </Button>
                                  {slot.lockedQuestionId ? (
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      className="text-slate-600 hover:text-slate-800"
                                      onClick={() =>
                                        syncSlots((current) =>
                                          current.map((item, itemIndex) =>
                                            itemIndex === index ? { ...item, lockedQuestionId: undefined } : item,
                                          ),
                                        )
                                      }
                                    >
                                      Clear
                                    </Button>
                                  ) : null}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </PagePanel>
            ) : null}
          </div>
        ) : null}

        {wizardStep === "review" ? (
          <div className="grid gap-4 xl:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <p className="text-sm font-semibold text-slate-900">Blueprint summary</p>
              <div className="mt-3 space-y-2 text-sm text-slate-600">
                <p><span className="font-medium text-slate-900">Title:</span> {draft.title || "Untitled"}</p>
                <p><span className="font-medium text-slate-900">Mode:</span> {blueprintModeLabel[draft.mode]}</p>
                <p><span className="font-medium text-slate-900">Status:</span> {blueprintStatusLabel[draft.status]}</p>
                <p><span className="font-medium text-slate-900">Total marks:</span> {draft.totalMarks}</p>
                <p><span className="font-medium text-slate-900">PDF style:</span> {draft.pdfTemplateKey === "myanmar_matric" ? "Myanmar Matric" : "Default"}</p>
                {draft.examYearLabel ? (
                  <p><span className="font-medium text-slate-900">Exam year:</span> {draft.examYearLabel}</p>
                ) : null}
                {draft.timeAllowedLabel ? (
                  <p><span className="font-medium text-slate-900">Time allowed:</span> {draft.timeAllowedLabel}</p>
                ) : null}
                <p><span className="font-medium text-slate-900">Sections:</span> {parsedSections.length}</p>
                <p><span className="font-medium text-slate-900">Slots:</span> {parsedSlots.length}</p>
              </div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <p className="text-sm font-semibold text-slate-900">Readiness check</p>
              <div className="mt-3 space-y-2 text-sm text-slate-600">
                <p className={cn(setupStepReady ? "text-emerald-700" : "text-rose-700")}>
                  Setup: {setupStepReady ? "ready" : "missing required fields"}
                </p>
                <p className={cn(hasValidDifficulty ? "text-emerald-700" : "text-rose-700")}>
                  Filters: {hasValidDifficulty ? "difficulty rules valid" : "difficulty rules need adjustment"}
                </p>
                <p className={cn(structureStepReady ? "text-emerald-700" : "text-rose-700")}>
                  Structure: {structureStepReady ? "structure is complete" : "sections or slots still need setup"}
                </p>
                <p className={cn(canSaveBlueprint ? "text-emerald-700" : "text-rose-700")}>
                  Save: {canSaveBlueprint ? "ready to save" : "cannot save yet"}
                </p>
              </div>
            </div>
          </div>
        ) : null}

        {wizardStep === "review" && !canSaveBlueprint ? (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Complete required fields before saving</AlertTitle>
            <AlertDescription>
              Title, grade, subject, valid difficulty percentages, and valid sections/slots configuration are required.
            </AlertDescription>
          </Alert>
        ) : null}

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-2">
            {wizardStep !== "setup" ? (
              <Button variant="outline" type="button" onClick={goToPreviousStep}>
                Back
              </Button>
            ) : null}
            {wizardStep !== "review" ? (
              <Button type="button" onClick={goToNextStep}>
                Next
              </Button>
            ) : null}
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
            <Button
              variant="outline"
              onClick={() => void navigate({ to: ADMIN_ROUTES.questionBlueprints })}
            >
              Cancel
            </Button>
            {wizardStep === "review" ? (
              <Button
                disabled={saveMutation.isPending || !canSaveBlueprint}
                onClick={() => {
                  try {
                    const input = validateBlueprintDraftBeforeSubmit(draft);
                    saveMutation.mutate(input);
                  } catch (error) {
                    toast.error(error instanceof Error ? error.message : "Invalid blueprint form data");
                  }
                }}
              >
                {saveMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : isEditing ? (
                  "Save changes"
                ) : (
                  "Create blueprint"
                )}
              </Button>
            ) : null}
          </div>
        </div>
      </PagePanel>

      <Dialog
        open={lockedPickerOpen}
        onOpenChange={(open) => {
          setLockedPickerOpen(open);
          if (!open) {
            setLockedPickerSlotIndex(null);
            setLockedPickerSearch("");
          }
        }}
      >
        <DialogContent className="max-h-[85vh] max-w-3xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Pick locked question</DialogTitle>
            <DialogDescription>
              Match this slot with an existing published question instead of entering ID manually.
            </DialogDescription>
          </DialogHeader>

          {lockedPickerSlot ? (
            <div className="space-y-4">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                <p className="font-semibold text-slate-900">Slot {lockedPickerSlot.slotNumber}</p>
                <p className="mt-1">
                  {lockedPickerSlot.questionType} • {lockedPickerSlot.marks} marks
                  {lockedPickerSlot.chapterId ? " • chapter filtered" : ""}
                  {lockedPickerSlot.subChapterId ? " • lesson filtered" : ""}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Available lessons: {lockedPickerSlotSubChapters.length}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="locked-question-search-page">Search question body or code</Label>
                <Input
                  id="locked-question-search-page"
                  value={lockedPickerSearch}
                  onChange={(event) => setLockedPickerSearch(event.target.value)}
                  placeholder="e.g. derivative, G12-MATH-..."
                />
              </div>

              {lockedQuestionCandidatesQuery.isLoading ? (
                <div className="flex items-center gap-2 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-sm text-slate-600">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Searching published questions...
                </div>
              ) : (lockedQuestionCandidatesQuery.data?.length ?? 0) === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-sm text-slate-500">
                  No matching published questions found for this slot.
                </div>
              ) : (
                <div className="space-y-2">
                  {lockedQuestionCandidatesQuery.data?.map((candidate) => (
                    <div
                      key={candidate.id}
                      className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 sm:flex-row sm:items-start sm:justify-between"
                    >
                      <div className="min-w-0 space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-semibold text-slate-900">{candidate.questionCode}</p>
                          <Badge variant="outline" className="border-slate-200 bg-slate-50 text-slate-700">
                            {candidate.type}
                          </Badge>
                          <Badge variant="outline" className="border-slate-200 bg-slate-50 text-slate-700">
                            {candidate.marks} marks
                          </Badge>
                        </div>
                        <p className="text-sm text-slate-600">
                          {toPlainBlueprintPreview(candidate.body || "No preview available")}
                        </p>
                      </div>
                      <Button
                        type="button"
                        onClick={() => {
                          if (typeof lockedPickerSlotIndex !== "number") return;
                          syncSlots((current) =>
                            current.map((item, itemIndex) =>
                              itemIndex === lockedPickerSlotIndex
                                ? { ...item, lockedQuestionId: candidate.id }
                                : item,
                            ),
                          );
                          setLockedPickerOpen(false);
                          setLockedPickerSlotIndex(null);
                          setLockedPickerSearch("");
                        }}
                      >
                        Use question
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
