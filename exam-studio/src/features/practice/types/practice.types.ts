export type PracticeQuestionType =
  | "mcq"
  | "true_false"
  | "short_answer"
  | "long_answer"
  | "fill_blank"
  | "matching";

export type PracticeGeneratorMode = "all_questions" | "mcq_only";

export type CatalogQuestion = {
  id: string;
  questionCode: string;
  title: string | null;
  bodyPreview: string;
  type: PracticeQuestionType;
  difficulty: "easy" | "medium" | "hard";
  mode: "static" | "variable";
  marks: number;
  estimatedTimeSec: number | null;
  grade: {
    id: string;
    code: string;
    name: string;
  };
  subject: {
    id: string;
    code: string;
    name: string;
  };
  chapter: {
    id: string;
    code: string | null;
    name: string;
    isFreePreview: boolean;
  } | null;
  subChapter: {
    id: string;
    code: string | null;
    name: string;
    isFreePreview: boolean;
  } | null;
  isFreePreview: boolean;
};

export type CatalogLockedQuestion = {
  id: string;
  questionCode: string;
  type: PracticeQuestionType;
  difficulty: "easy" | "medium" | "hard";
  mode: "static" | "variable";
  marks: number;
  estimatedTimeSec: number | null;
  grade: {
    id: string;
    code: string;
    name: string;
  };
  subject: {
    id: string;
    code: string;
    name: string;
  };
  chapter: {
    id: string;
    code: string | null;
    name: string;
    isFreePreview: boolean;
  } | null;
  subChapter: {
    id: string;
    code: string | null;
    name: string;
    isFreePreview: boolean;
  } | null;
  isFreePreview: boolean;
  lockReasonCode: string;
  lockReason: string;
};

export type WorkspaceCatalogResponse = {
  rows: CatalogQuestion[];
  lockedRows: CatalogLockedQuestion[];
  lockedTotal: number;
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export type CatalogQueryParams = {
  search?: string;
  gradeId?: string;
  subjectId?: string;
  chapterId?: string;
  subChapterId?: string;
  questionType?: PracticeQuestionType;
  excludeQuestionTypes?: PracticeQuestionType[];
  page?: number;
  pageSize?: number;
};

export type CreatePracticeSessionInput = {
  title?: string;
  search?: string;
  gradeId?: string;
  subjectId?: string;
  chapterId?: string;
  subChapterId?: string;
  questionType?: PracticeQuestionType;
  generatorMode?: PracticeGeneratorMode;
  questionIds?: string[];
  count?: number;
};

export type CreatePracticeSessionResponse = {
  id: string;
  totalQuestions: number;
  title: string;
};

export type PracticeSessionListRow = {
  id: string;
  title: string;
  status: "started" | "completed";
  totalQuestions: number;
  correctAnswers: number | null;
  scorePercent: number | null;
  startedAt: string;
  completedAt: string | null;
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

export type PracticeSessionListResponse = {
  rows: PracticeSessionListRow[];
};

export type PracticeSessionItemOption = {
  label: string | null;
  text: string;
  isCorrect?: boolean;
};

export type PracticeSessionItem = {
  id: string;
  position: number;
  questionCode: string;
  questionType: PracticeQuestionType;
  marks: number;
  body: string;
  explanation: string | null;
  answerText: string | null;
  options: PracticeSessionItemOption[];
  variableContext: unknown;
  submittedAnswer: string | null;
  isCorrect: boolean | null;
};

export type PracticeSessionDetail = {
  id: string;
  title: string;
  status: "started" | "completed";
  totalQuestions: number;
  correctAnswers: number | null;
  scorePercent: number | null;
  startedAt: string;
  completedAt: string | null;
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
  items: PracticeSessionItem[];
};

export type SubmitPracticeSessionInput = {
  answers: Array<{
    itemId: string;
    answer?: string;
  }>;
};
