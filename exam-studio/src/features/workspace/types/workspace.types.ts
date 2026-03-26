export type WorkspaceMetaResponse = {
  grades: Array<{ id: string; code: string; name: string }>;
  subjects: Array<{ id: string; code: string; name: string }>;
  gradeSubjects: Array<{ gradeId: string; subjectId: string }>;
  chapters: Array<{
    id: string;
    code: string | null;
    name: string;
    gradeId: string;
    subjectId: string;
    isFreePreview: boolean;
  }>;
  subChapters: Array<{
    id: string;
    code: string | null;
    name: string;
    chapterId: string;
    isFreePreview: boolean;
  }>;
};

export type WorkspaceSummaryResponse = {
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
      maxQuestionsPerPractice: number | null;
      maxQuestionsPerPaper: number | null;
      monthlyPdfExportLimit: number | null;
      monthlyPaperGenerationLimit: number | null;
      monthlyPaperSwapLimit: number | null;
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
      pdfExports: number | null;
      paperGenerations: number | null;
      paperSwaps: number | null;
    };
    currentPeriodStart: string | null;
    currentPeriodEnd: string | null;
    entitlement: {
      isFallbackToFree: boolean;
      reason: "active" | "inactive_status" | "expired_end_date";
    };
    assignedPlan: {
      code: "free" | "pro" | "premium";
      name: string;
    };
    latestRequest: {
      id: string;
      requestedPlanCode: "free" | "pro" | "premium";
      status: "pending" | "approved" | "rejected" | "canceled";
      transactionId: string | null;
      hasPaymentProof?: boolean;
      paymentProofImageDataUrl?: string | null;
      note: string | null;
      adminNote: string | null;
      reviewedAt: string | null;
      createdAt: string;
      updatedAt: string;
      reviewer?: {
        id: string;
        name: string;
        email: string;
      } | null;
    } | null;
  };
};
