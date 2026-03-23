import type { CatalogQuestion } from "@/features/practice/types/practice.types";

export type PaperQuestionType =
  | "mcq"
  | "true_false"
  | "short_answer"
  | "long_answer"
  | "fill_blank"
  | "matching";

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
  answerText: string | null;
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
};

export type CreateQuestionPaperResponse = {
  id: string;
  title: string;
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
