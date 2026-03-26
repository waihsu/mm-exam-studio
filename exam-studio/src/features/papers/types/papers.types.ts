import type { CatalogQuestion } from "@/features/practice/types/practice.types";

export type PaperQuestionType =
  | "mcq"
  | "true_false"
  | "short_answer"
  | "long_answer"
  | "fill_blank"
  | "matching";

export type PaperQuestionMixEntry = {
  questionType: PaperQuestionType;
  count: number;
};

export type PaperTemplateSummary = {
  id: string;
  title: string;
  mode: "custom" | "mcq_only" | "all_type";
  status: "draft" | "ready" | "archived";
  totalMarks: number;
  includeAnswerPaper: boolean;
  templateConfig: {
    isPublished: boolean;
    availablePlanCodes: Array<"free" | "pro" | "premium">;
  };
  createdAt: string;
  updatedAt: string;
  generatedPaperCount: number;
  sectionCount: number;
  slotCount: number;
  latestGeneratedPaper: {
    id: string;
    title: string;
    status: "draft" | "finalized";
    totalQuestions: number;
    totalMarks: number;
    exportedAt: string | null;
    createdAt: string;
    updatedAt: string;
  } | null;
  grade: {
    id: string;
    code: string | null;
    name: string;
  };
  subject: {
    id: string;
    code: string | null;
    name: string;
  };
};

export type PaperTemplateListResponse = {
  rows: PaperTemplateSummary[];
  access: {
    planCode: "free" | "pro" | "premium";
  };
};

export type PaperTemplateSection = {
  id: string;
  code: string;
  title: string | null;
  questionType: PaperQuestionType | null;
  marksPerQuestion: 1 | 2 | 3 | 5 | 10 | null;
  questionCount: number;
  totalMarks: number;
  sortOrder: number;
};

export type PaperTemplateSlot = {
  id: string;
  sectionId: string | null;
  sectionCode: string | null;
  slotNumber: number;
  questionType: PaperQuestionType;
  marks: 1 | 2 | 3 | 5 | 10;
  difficultyTarget: "easy" | "normal" | "hard" | "advance" | null;
  chapterId: string | null;
  subChapterId: string | null;
  swapLimit: number;
  chapter: {
    id: string;
    code: string | null;
    name: string;
  } | null;
  subChapter: {
    id: string;
    code: string | null;
    name: string;
  } | null;
};

export type PaperTemplateDetail = {
  id: string;
  title: string;
  mode: "custom" | "mcq_only" | "all_type";
  status: "draft" | "ready" | "archived";
  totalMarks: number;
  includeAnswerPaper: boolean;
  difficultyDistribution: {
    easy: number;
    normal: number;
    hard: number;
    advance: number;
  };
  templateConfig: {
    isPublished: boolean;
    availablePlanCodes: Array<"free" | "pro" | "premium">;
  };
  presetConfig: {
    chapterIds?: string[];
    subChapterIds?: string[];
  };
  createdAt: string;
  updatedAt: string;
  generatedPaperCount: number;
  latestGeneratedPaper: {
    id: string;
    title: string;
    status: "draft" | "finalized";
    totalQuestions: number;
    totalMarks: number;
    exportedAt: string | null;
    createdAt: string;
    updatedAt: string;
  } | null;
  sectionCount: number;
  slotCount: number;
  grade: {
    id: string;
    code: string | null;
    name: string;
  };
  subject: {
    id: string;
    code: string | null;
    name: string;
  };
  sections: PaperTemplateSection[];
  slots: PaperTemplateSlot[];
  access: {
    planCode: "free" | "pro" | "premium";
  };
};

export type QuestionPaperSummary = {
  id: string;
  title: string;
  status: "draft" | "finalized";
  includeAnswerKey: boolean;
  totalQuestions: number;
  totalMarks: number;
  schoolName: string | null;
  academicYear: string | null;
  exportedAt: string | null;
  createdAt: string;
  updatedAt: string;
  grade: {
    id: string;
    name: string;
    code: string;
  } | null;
  subject: {
    id: string;
    name: string;
    code: string;
  } | null;
};

export type QuestionPaperListResponse = {
  rows: QuestionPaperSummary[];
};

export type QuestionPaperItemOption = {
  label: string | null;
  text: string;
  isCorrect?: boolean;
};

export type QuestionPaperItem = {
  id: string;
  questionId: string;
  position: number;
  questionCode: string;
  questionType: PaperQuestionType;
  marks: number;
  body: string;
  questionImageUrls: string[];
  answerText: string | null;
  solutionImageUrls: string[];
  options: QuestionPaperItemOption[];
};

export type QuestionPaperDetail = {
  id: string;
  title: string;
  instructions: string | null;
  schoolName: string | null;
  brandAsset: {
    id: string;
    label: string;
    imageDataUrl: string;
    isPrimary: boolean;
  } | null;
  teacherName: string | null;
  academicYear: string | null;
  includeAnswerKey: boolean;
  status: "draft" | "finalized";
  totalQuestions: number;
  totalMarks: number;
  exportedAt: string | null;
  createdAt: string;
  updatedAt: string;
  grade: {
    id: string;
    name: string;
    code: string;
  } | null;
  subject: {
    id: string;
    name: string;
    code: string;
  } | null;
  chapter: {
    id: string;
    name: string;
    code: string | null;
  } | null;
  subChapter: {
    id: string;
    name: string;
    code: string | null;
  } | null;
  items: QuestionPaperItem[];
};

export type CreateQuestionPaperInput = {
  title: string;
  instructions?: string;
  schoolName?: string;
  academicYear?: string;
  includeAnswerKey?: boolean;
  search?: string;
  gradeId?: string;
  subjectId?: string;
  chapterId?: string;
  subChapterId?: string;
  questionType?: PaperQuestionType;
  generatorMode?: "all_questions" | "mcq_only";
  questionIds?: string[];
  count?: number;
  questionMix?: PaperQuestionMixEntry[];
};

export type CreateQuestionPaperResponse = {
  id: string;
  title: string;
};

export type MaterializePaperTemplateInput = {
  title?: string;
  instructions?: string;
  schoolName?: string;
  academicYear?: string;
  brandAssetId?: string;
};

export type UpdateQuestionPaperInput = {
  title: string;
  instructions?: string;
  schoolName?: string;
  academicYear?: string;
  includeAnswerKey?: boolean;
};

export type ReorderQuestionPaperItemsInput = {
  itemIds: string[];
};

export type SwapQuestionPaperItemInput = {
  candidateQuestionId?: string;
};

export type QuestionPaperSwapCandidatesResponse = {
  rows: CatalogQuestion[];
};

export type ExportedQuestionPaperSummary = {
  id: string;
  title: string;
  exportedAt: string | null;
  totalQuestions: number;
  totalMarks: number;
  schoolName: string | null;
  academicYear: string | null;
  grade: {
    id: string;
    name: string;
    code: string;
  } | null;
  subject: {
    id: string;
    name: string;
    code: string;
  } | null;
};

export type ExportedQuestionPaperListResponse = {
  rows: ExportedQuestionPaperSummary[];
};
