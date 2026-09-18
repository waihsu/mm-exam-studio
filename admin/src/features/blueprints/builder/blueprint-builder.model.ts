import type { BlueprintMaterializeDraft } from "../components/blueprint-preview-content";
import type {
  PaperBlueprintMode,
  PaperBlueprintPlanCode,
  PaperBlueprintStatus,
  PaperPdfTemplateKey,
} from "../types";

export type BlueprintFormDraft = {
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

export type BlueprintWizardStep = "setup" | "filters" | "structure" | "review";

export const EMPTY_SECTIONS_JSON = "[]";
export const EMPTY_SLOTS_JSON = "[]";

export const blueprintWizardSteps: Array<{
  key: BlueprintWizardStep;
  label: string;
  description: string;
}> = [
  { key: "setup", label: "Setup", description: "Core paper identity" },
  { key: "filters", label: "Filters", description: "Difficulty and scope" },
  { key: "structure", label: "Structure", description: "Sections and slots" },
  { key: "review", label: "Review", description: "Final check" },
];

export const createEmptyDraft = (): BlueprintFormDraft => ({
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
  difficultyDistribution: { easy: "40", normal: "30", hard: "20", advance: "10" },
  presetChapterIds: [],
  presetSubChapterIds: [],
  sectionsJson: EMPTY_SECTIONS_JSON,
  slotsJson: EMPTY_SLOTS_JSON,
});

export const createMaterializeDraft = (title = ""): BlueprintMaterializeDraft => ({
  title,
  schoolName: "",
  academicYear: "",
  instructions: "",
});
