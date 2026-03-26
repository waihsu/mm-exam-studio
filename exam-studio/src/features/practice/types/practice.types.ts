export type PracticeQuestionType =
  | "mcq"
  | "true_false"
  | "short_answer"
  | "long_answer"
  | "fill_blank"
  | "matching";

export type PracticeSessionStatus = "active" | "completed";

export type PracticeGeneratorMode = "all_questions" | "mcq_only";
export type PracticeQuestionMixEntry = {
  questionType: PracticeQuestionType;
  count: number;
};

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

export type WorkspaceCatalogQuickCountsResponse = {
  all: number;
  mcq: number;
  true_false: number;
  short_answer: number;
  long_answer: number;
  fill_blank: number;
  matching: number;
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
  questionMix?: PracticeQuestionMixEntry[];
};

export type CreatePracticeSessionResponse = {
  id: string;
  totalQuestions: number;
  title: string;
};

export type PracticeSessionListRow = {
  id: string;
  title: string;
  status: PracticeSessionStatus;
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

export type DeletePracticeSessionResponse = {
  id: string;
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
  questionImageUrls: string[];
  solutionImageUrls: string[];
  options: PracticeSessionItemOption[];
  variableContext: unknown;
  submittedAnswer: string | null;
  isCorrect: boolean | null;
};

export type PracticeSessionDetail = {
  id: string;
  title: string;
  status: PracticeSessionStatus;
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
