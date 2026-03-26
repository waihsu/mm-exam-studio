export type PaperBlueprintMode = "custom" | "mcq_only" | "all_type";
export type PaperBlueprintStatus = "draft" | "ready" | "archived";
export type PaperBlueprintDifficulty = "easy" | "normal" | "hard" | "advance";
export type PaperBlueprintPlanCode = "free" | "pro" | "premium";
export type PaperPdfTemplateKey = "default" | "myanmar_matric";
export type PaperBlueprintQuestionType =
  | "mcq"
  | "true_false"
  | "short_answer"
  | "long_answer"
  | "fill_blank"
  | "matching";

export type PaperBlueprintTemplateConfig = {
  isPublished: boolean;
  availablePlanCodes: PaperBlueprintPlanCode[];
};

export type BlueprintTaxonomyRef = {
  id: string;
  code: string | null;
  name: string;
};

export type PaperBlueprintOwner = {
  id: string;
  name: string;
  email: string;
};

export type GeneratedPaperSummary = {
  id: string;
  title: string;
  status: "draft" | "finalized";
  totalQuestions: number;
  totalMarks: number;
  exportedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type PaperBlueprintListRow = {
  id: string;
  title: string;
  mode: PaperBlueprintMode;
  status: PaperBlueprintStatus;
  totalMarks: number;
  pdfTemplateKey: PaperPdfTemplateKey;
  examYearLabel: string | null;
  timeAllowedLabel: string | null;
  departmentLine: string | null;
  answerInstructionLine: string | null;
  includeAnswerPaper: boolean;
  templateConfig: PaperBlueprintTemplateConfig;
  createdAt: string;
  updatedAt: string;
  generatedPaperCount: number;
  latestGeneratedPaper: GeneratedPaperSummary | null;
  owner: PaperBlueprintOwner | null;
  sectionCount: number;
  slotCount: number;
  grade: BlueprintTaxonomyRef;
  subject: BlueprintTaxonomyRef;
};

export type PaperBlueprintListResult = {
  rows: PaperBlueprintListRow[];
};

export type PaperBlueprintSection = {
  id: string;
  code: string;
  title: string | null;
  questionType: PaperBlueprintQuestionType | null;
  marksPerQuestion: 1 | 2 | 3 | 5 | 10 | null;
  questionCount: number;
  totalMarks: number;
  sortOrder: number;
};

export type PaperBlueprintSlotQuestion = {
  id: string;
  questionCode: string;
  type: PaperBlueprintQuestionType;
  marks: number;
  title: string | null;
};

export type PaperBlueprintSlot = {
  id: string;
  sectionId: string | null;
  sectionCode: string | null;
  slotNumber: number;
  questionType: PaperBlueprintQuestionType;
  marks: 1 | 2 | 3 | 5 | 10;
  difficultyTarget: PaperBlueprintDifficulty | null;
  chapterId: string | null;
  subChapterId: string | null;
  swapLimit: number;
  slotConfig: Record<string, unknown> | null;
  chapter: BlueprintTaxonomyRef | null;
  subChapter: BlueprintTaxonomyRef | null;
  lockedQuestion: PaperBlueprintSlotQuestion | null;
  generatedQuestion: PaperBlueprintSlotQuestion | null;
};

export type PaperBlueprintDetail = {
  id: string;
  title: string;
  mode: PaperBlueprintMode;
  status: PaperBlueprintStatus;
  totalMarks: number;
  pdfTemplateKey: PaperPdfTemplateKey;
  examYearLabel: string | null;
  timeAllowedLabel: string | null;
  departmentLine: string | null;
  answerInstructionLine: string | null;
  includeAnswerPaper: boolean;
  difficultyDistribution: {
    easy: number;
    normal: number;
    hard: number;
    advance: number;
  };
  presetConfig: {
    chapterIds?: string[];
    subChapterIds?: string[];
  };
  templateConfig: PaperBlueprintTemplateConfig;
  createdAt: string;
  updatedAt: string;
  generatedPaperCount: number;
  latestGeneratedPaper: GeneratedPaperSummary | null;
  owner: PaperBlueprintOwner | null;
  grade: BlueprintTaxonomyRef;
  subject: BlueprintTaxonomyRef;
  generatedPapers: GeneratedPaperSummary[];
  sections: PaperBlueprintSection[];
  slots: PaperBlueprintSlot[];
};

export type PaperBlueprintPreviewIssueCode =
  | "locked_question_duplicate"
  | "slot_insufficient_matches"
  | "all_type_missing_sections"
  | "mcq_only_insufficient_matches"
  | "section_missing_configuration"
  | "section_insufficient_matches";

export type PaperBlueprintPreviewIssue = {
  code: PaperBlueprintPreviewIssueCode;
  message: string;
  sectionCode: string | null;
  slotNumber: number | null;
  details: Record<string, unknown> | null;
};

export type PaperBlueprintPreviewSectionSummary = {
  code: string;
  title: string | null;
  questionType: PaperBlueprintQuestionType | null;
  marksPerQuestion: number | null;
  requestedCount: number;
  matchedCount: number;
  enough: boolean;
  buckets: Array<{
    difficulty: PaperBlueprintDifficulty;
    requiredCount: number;
    matchedCount: number;
  }>;
};

export type PaperBlueprintPreviewSlotSummary = {
  slotNumber: number;
  sectionCode: string | null;
  questionType: PaperBlueprintQuestionType;
  marks: number;
  difficultyTarget: PaperBlueprintDifficulty | null;
  matchedCount: number;
  enough: boolean;
  lockedQuestionId: string | null;
};

export type PaperBlueprintPreviewSummary = {
  blueprint: {
    id: string;
    title: string;
    mode: PaperBlueprintMode;
    status: PaperBlueprintStatus;
    totalMarks: number;
  };
  readyToMaterialize: boolean;
  issueCount: number;
  reservedQuestionCount: number;
  issues: PaperBlueprintPreviewIssue[];
  sections: PaperBlueprintPreviewSectionSummary[];
  slots: PaperBlueprintPreviewSlotSummary[];
};

export type PaperBlueprintSectionInput = {
  code: string;
  title?: string;
  questionType?: PaperBlueprintQuestionType;
  marksPerQuestion?: 1 | 2 | 3 | 5 | 10;
  questionCount: number;
  totalMarks: number;
  sortOrder: number;
};

export type PaperBlueprintSlotInput = {
  sectionCode?: string;
  slotNumber: number;
  questionType: PaperBlueprintQuestionType;
  marks: 1 | 2 | 3 | 5 | 10;
  difficultyTarget?: PaperBlueprintDifficulty;
  chapterId?: string;
  subChapterId?: string;
  lockedQuestionId?: string;
  swapLimit?: number;
  slotConfig?: Record<string, unknown>;
};

export type PaperBlueprintSubmitInput = {
  title: string;
  mode: PaperBlueprintMode;
  status: PaperBlueprintStatus;
  gradeId: string;
  subjectId: string;
  totalMarks: number;
  pdfTemplateKey: PaperPdfTemplateKey;
  examYearLabel?: string;
  timeAllowedLabel?: string;
  departmentLine?: string;
  answerInstructionLine?: string;
  includeAnswerPaper?: boolean;
  difficultyDistribution: {
    easy: number;
    normal: number;
    hard: number;
    advance: number;
  };
  presetConfig?: {
    chapterIds?: string[];
    subChapterIds?: string[];
  };
  templateConfig?: PaperBlueprintTemplateConfig;
  sections: PaperBlueprintSectionInput[];
  slots: PaperBlueprintSlotInput[];
};

export type MaterializeBlueprintInput = {
  title?: string;
  instructions?: string;
  schoolName?: string;
  academicYear?: string;
  pdfTemplateKey?: PaperPdfTemplateKey;
  examYearLabel?: string;
  timeAllowedLabel?: string;
  departmentLine?: string;
  answerInstructionLine?: string;
  brandAssetId?: string;
};

export type MaterializedBlueprintResult = {
  id: string;
  title: string;
};

export type WorkspacePaperStatus = "draft" | "finalized";

export type WorkspacePaperDetail = {
  id: string;
  title: string;
  instructions: string | null;
  schoolName: string | null;
  academicYear: string | null;
  pdfTemplateKey: PaperPdfTemplateKey;
  examYearLabel: string | null;
  timeAllowedLabel: string | null;
  departmentLine: string | null;
  answerInstructionLine: string | null;
  includeAnswerKey: boolean;
  status: WorkspacePaperStatus;
  totalQuestions: number;
  totalMarks: number;
  exportedAt: string | null;
  createdAt: string;
  updatedAt: string;
  teacherName: string | null;
  items: Array<{
    id: string;
    questionId: string;
    position: number;
    questionCode: string;
    questionType: PaperBlueprintQuestionType;
    marks: number;
    swapCount: number;
    swapLimit: number;
    swapsRemaining: number;
    body: string;
    answerText: string | null;
  }>;
};
