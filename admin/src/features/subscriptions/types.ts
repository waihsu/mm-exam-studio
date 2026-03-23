export type PlanCode = "free" | "pro" | "premium";
export type SubscriptionStatus = "active" | "canceled" | "past_due" | "expired";
export type BillingCycle = "monthly" | "yearly" | "lifetime";

export type AdminPlanRecord = {
  id: string;
  code: PlanCode;
  name: string;
  description: string | null;
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

export type AdminSubscriptionRow = {
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    accountStatus: string;
    createdAt: string;
    updatedAt: string;
  };
  subscription: {
    id: string;
    status: SubscriptionStatus;
    billingCycle: BillingCycle;
    startsAt: string;
    endsAt: string | null;
    currentPeriodStart: string;
    currentPeriodEnd: string | null;
    plan: {
      code: PlanCode;
      name: string;
      description: string | null;
    };
    defaults: {
      deviceLimit: number;
      maxQuestionsPerPractice: number | null;
      maxQuestionsPerPaper: number | null;
      monthlyPdfExportLimit: number | null;
      monthlyPaperGenerationLimit: number | null;
      monthlyPaperSwapLimit: number | null;
      brandingLogoLimit: number;
    };
    limits: {
      deviceLimit: number;
      maxQuestionsPerPractice: number | null;
      maxQuestionsPerPaper: number | null;
      monthlyPdfExportLimit: number | null;
      monthlyPaperGenerationLimit: number | null;
      monthlyPaperSwapLimit: number | null;
    };
    overrides: {
      deviceLimitOverride: number | null;
      maxQuestionsPerPracticeOverride: number | null;
      maxQuestionsPerPaperOverride: number | null;
      monthlyPdfExportLimitOverride: number | null;
      monthlyPaperGenerationLimitOverride: number | null;
      monthlyPaperSwapLimitOverride: number | null;
    };
    usage: {
      pdfExportsUsed: number;
      paperGenerationsUsed: number;
      paperSwapsUsed: number;
      chatMessagesUsed: number;
    };
    activeDeviceCount: number;
  };
};

export type PaginatedAdminSubscriptionResult = {
  rows: AdminSubscriptionRow[];
  total: number;
  page: number;
  pageSize: number;
};

export type AdminSubscriptionFilters = {
  page?: number;
  pageSize?: number;
  search?: string;
  planCode?: PlanCode;
  status?: SubscriptionStatus;
};

export type UpdateAdminSubscriptionInput = {
  planCode: PlanCode;
  status: SubscriptionStatus;
  billingCycle: BillingCycle;
  endsAt?: string | null;
  deviceLimitOverride?: number | null;
  maxQuestionsPerPracticeOverride?: number | null;
  maxQuestionsPerPaperOverride?: number | null;
  monthlyPdfExportLimitOverride?: number | null;
  monthlyPaperGenerationLimitOverride?: number | null;
  monthlyPaperSwapLimitOverride?: number | null;
};

export type SubscriptionRequestStatus = "pending" | "approved" | "rejected" | "canceled";

export type AdminSubscriptionRequest = {
  id: string;
  requestedPlanCode: PlanCode;
  status: SubscriptionRequestStatus;
  transactionId?: string | null;
  hasPaymentProof?: boolean;
  paymentProofImageDataUrl?: string | null;
  note?: string | null;
  adminNote?: string | null;
  reviewedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    name: string;
    email: string;
  };
  reviewer?: {
    id: string;
    name: string;
    email: string;
  } | null;
};

export type PaginatedAdminSubscriptionRequestResult = {
  rows: AdminSubscriptionRequest[];
  total: number;
  page: number;
  pageSize: number;
};
