export type WorkspaceTaxonomyOption = {
  id: string;
  code?: string | null;
  name: string;
  isFreePreview?: boolean;
};

export type WorkspaceGradeSubject = {
  gradeId: string;
  subjectId: string;
};

export type WorkspaceChapter = WorkspaceTaxonomyOption & {
  gradeId: string;
  subjectId: string;
};

export type WorkspaceSubChapter = WorkspaceTaxonomyOption & {
  chapterId: string;
};

export type WorkspaceMeta = {
  grades: WorkspaceTaxonomyOption[];
  subjects: WorkspaceTaxonomyOption[];
  gradeSubjects: WorkspaceGradeSubject[];
  chapters: WorkspaceChapter[];
  subChapters: WorkspaceSubChapter[];
};

export type WorkspaceCatalogQuestion = {
  id: string;
  questionCode: string;
  title?: string | null;
  bodyPreview: string;
  type: "mcq" | "true_false" | "short_answer" | "fill_blank" | "matching";
  difficulty: "easy" | "medium" | "hard";
  mode: "static" | "variable";
  marks: number;
  estimatedTimeSec?: number | null;
  grade: WorkspaceTaxonomyOption;
  subject: WorkspaceTaxonomyOption;
  chapter?: WorkspaceTaxonomyOption | null;
  subChapter?: WorkspaceTaxonomyOption | null;
  isFreePreview: boolean;
};

export type WorkspaceQuestionType =
  | "mcq"
  | "true_false"
  | "short_answer"
  | "long_answer"
  | "fill_blank"
  | "matching";

export type WorkspaceQuestionMixEntry = {
  questionType: WorkspaceQuestionType;
  count: number;
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

export type WorkspaceSummary = {
  publishedQuestionCount: number;
  practiceSessionsCount: number;
  completedPracticeCount: number;
  papersCount: number;
  exportedPapersCount: number;
  brandingCount: number;
  notifications: {
    unreadCount: number;
    supportUnreadCount: number;
    supportConversation: {
      status: "open" | "closed";
      allowUserReplies: boolean;
      lastMessagePreview: string | null;
      lastMessageAt: string | null;
    } | null;
    hasPendingSubscriptionRequest: boolean;
  };
  subscription: {
    code: "free" | "pro" | "premium";
    name: string;
    status: "active" | "canceled" | "past_due" | "expired";
    billingCycle: "monthly" | "yearly" | "lifetime";
    limits: {
      deviceLimit: number;
      maxQuestionsPerPractice?: number | null;
      maxQuestionsPerPaper?: number | null;
      monthlyPdfExportLimit?: number | null;
      monthlyPaperGenerationLimit?: number | null;
      monthlyPaperSwapLimit?: number | null;
      brandingLogoLimit: number;
      chatEnabled: boolean;
      generatorEnabled: boolean;
      offlineDrmEnabled: boolean;
      screenshotBlockEnabled: boolean;
      printAllowed: boolean;
    };
    usage: {
      pdfExportsUsed: number;
      paperGenerationsUsed: number;
      paperSwapsUsed: number;
      chatMessagesUsed: number;
    };
    remaining: {
      pdfExports?: number | null;
      paperGenerations?: number | null;
      paperSwaps?: number | null;
    };
    currentPeriodStart: string;
    currentPeriodEnd?: string | null;
    latestRequest?: SubscriptionRequestRecord | null;
  };
};

export type SubscriptionRequestRecord = {
  id: string;
  requestedPlanCode: "free" | "pro" | "premium";
  status: "pending" | "approved" | "rejected" | "canceled";
  transactionId?: string | null;
  paymentProofImageDataUrl?: string | null;
  note?: string | null;
  adminNote?: string | null;
  reviewedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  reviewer?: {
    id: string;
    name: string;
    email: string;
  } | null;
};

export type BrandAsset = {
  id: string;
  label: string;
  imageDataUrl: string;
  isPrimary: boolean;
  createdAt: string;
};

export type PracticeSessionSummary = {
  id: string;
  title?: string | null;
  status: "active" | "completed";
  totalQuestions: number;
  correctAnswers: number;
  scorePercent?: number | null;
  startedAt: string;
  completedAt?: string | null;
  grade?: WorkspaceTaxonomyOption | null;
  subject?: WorkspaceTaxonomyOption | null;
};

export type PracticeSessionOption = {
  label?: string | null;
  text: string;
  isCorrect?: boolean;
};

export type PracticeSessionItem = {
  id: string;
  position: number;
  questionCode: string;
  questionType: "mcq" | "true_false" | "short_answer" | "fill_blank" | "matching";
  marks: number;
  body: string;
  explanation?: string | null;
  answerText?: string | null;
  options: PracticeSessionOption[];
  variableContext?: Record<string, string | number> | null;
  submittedAnswer?: string | null;
  isCorrect?: boolean | null;
};

export type PracticeSessionDetail = {
  id: string;
  title?: string | null;
  status: "active" | "completed";
  totalQuestions: number;
  correctAnswers: number;
  scorePercent?: number | null;
  startedAt: string;
  completedAt?: string | null;
  grade?: WorkspaceTaxonomyOption | null;
  subject?: WorkspaceTaxonomyOption | null;
  chapter?: WorkspaceTaxonomyOption | null;
  subChapter?: WorkspaceTaxonomyOption | null;
  items: PracticeSessionItem[];
};

export type QuestionPaperSummary = {
  id: string;
  title: string;
  status: "draft" | "finalized";
  includeAnswerKey: boolean;
  totalQuestions: number;
  totalMarks: number;
  schoolName?: string | null;
  academicYear?: string | null;
  exportedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  grade?: WorkspaceTaxonomyOption | null;
  subject?: WorkspaceTaxonomyOption | null;
};

export type QuestionPaperItem = {
  id: string;
  questionId: string;
  position: number;
  questionCode: string;
  questionType: "mcq" | "true_false" | "short_answer" | "fill_blank" | "matching";
  marks: number;
  body: string;
  answerText?: string | null;
  options: PracticeSessionOption[];
};

export type QuestionPaperDetail = {
  id: string;
  title: string;
  instructions?: string | null;
  schoolName?: string | null;
  brandAsset?: BrandAsset | null;
  teacherName?: string | null;
  academicYear?: string | null;
  includeAnswerKey: boolean;
  status: "draft" | "finalized";
  totalQuestions: number;
  totalMarks: number;
  exportedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  grade?: WorkspaceTaxonomyOption | null;
  subject?: WorkspaceTaxonomyOption | null;
  chapter?: WorkspaceTaxonomyOption | null;
  subChapter?: WorkspaceTaxonomyOption | null;
  items: QuestionPaperItem[];
};

export type WorkspaceFilters = {
  search: string;
  gradeId: string;
  subjectId: string;
  chapterId: string;
  subChapterId: string;
};
