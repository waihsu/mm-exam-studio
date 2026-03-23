export type QuestionType =
  | "mcq"
  | "true_false"
  | "short_answer"
  | "long_answer"
  | "fill_blank"
  | "matching";
export type QuestionDifficulty = "easy" | "medium" | "hard";
export type QuestionMode = "static" | "variable";
export type QuestionVariableType = "number" | "text";
export type QuestionReviewStatus =
  | "draft"
  | "in_review"
  | "needs_changes"
  | "approved";

export type QuestionTaxonomyOption = {
  id: string;
  code: string | null;
  name: string;
};

export type GradeSubjectLink = {
  gradeId: string;
  subjectId: string;
};

export type QuestionChapter = QuestionTaxonomyOption & {
  gradeId: string;
  subjectId: string;
};

export type QuestionSubChapter = QuestionTaxonomyOption & {
  chapterId: string;
};

export type QuestionOption = {
  id?: string;
  label?: string | null;
  text: string;
  isCorrect: boolean;
  sortOrder?: number;
};

export type QuestionVariableDefinition = {
  key: string;
  label?: string;
  type: QuestionVariableType;
  min?: number;
  max?: number;
  step?: number;
  choices?: string[];
};

export type QuestionPreview = {
  context: Record<string, string | number>;
  body: string;
  explanation?: string | null;
  answerText?: string | null;
  options: Array<{
    label?: string | null;
    text: string;
    isCorrect: boolean;
  }>;
};

export type QuestionRecord = {
  id: string;
  questionCode: string;
  body: string;
  type: QuestionType;
  difficulty: QuestionDifficulty;
  mode: QuestionMode;
  reviewStatus: QuestionReviewStatus;
  reviewNotes?: string | null;
  explanation?: string | null;
  answerText?: string | null;
  answerFormula?: string | null;
  variablesSchema?: QuestionVariableDefinition[] | null;
  marks: number;
  isPublished: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  grade: QuestionTaxonomyOption;
  subject: QuestionTaxonomyOption;
  chapter?: QuestionTaxonomyOption | null;
  subChapter?: QuestionTaxonomyOption | null;
  creator?: {
    id: string;
    name: string | null;
    email: string | null;
  } | null;
  reviewer?: {
    id: string;
    name: string | null;
    email: string | null;
  } | null;
  reviewedAt?: string | null;
  options: QuestionOption[];
};

export type QuestionFilters = {
  search?: string;
  gradeId?: string;
  subjectId?: string;
  chapterId?: string;
  subChapterId?: string;
  type?: QuestionType;
  mode?: QuestionMode;
  difficulty?: QuestionDifficulty;
  isPublished?: boolean;
  page?: number;
  pageSize?: number;
};

export type PaginatedQuestionResult = {
  rows: QuestionRecord[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  summary: {
    published: number;
    draft: number;
    variable: number;
  };
};

export type QuestionMeta = {
  grades: QuestionTaxonomyOption[];
  subjects: QuestionTaxonomyOption[];
  gradeSubjects: GradeSubjectLink[];
  chapters: QuestionChapter[];
  subChapters: QuestionSubChapter[];
};

export type QuestionImportResult = {
  summary: {
    total: number;
    succeeded: number;
    failed: number;
  };
  created: Array<{
    index: number;
    id: string;
    questionCode: string;
  }>;
  failures: Array<{
    index: number;
    questionCode: string;
    message: string;
  }>;
};
