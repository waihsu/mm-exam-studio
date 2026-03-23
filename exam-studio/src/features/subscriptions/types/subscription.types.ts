export type SubscriptionPlanCode = "free" | "pro" | "premium";
export type SubscriptionRequestStatus = "pending" | "approved" | "rejected" | "canceled";

export type SubscriptionPlan = {
  id: string;
  code: SubscriptionPlanCode;
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

export type SubscriptionRequest = {
  id: string;
  requestedPlanCode: SubscriptionPlanCode;
  status: SubscriptionRequestStatus;
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
};

export type CreateSubscriptionRequestInput = {
  planCode: Extract<SubscriptionPlanCode, "pro" | "premium">;
  transactionId: string;
  paymentProofImageDataUrl?: string;
  note?: string;
};

export type CurrentSubscriptionRequestResponse = {
  data: SubscriptionRequest | null;
};

export type SubscriptionRequestListResponse = {
  rows: SubscriptionRequest[];
};

export type SubscriptionPaymentConfig = {
  channelName: string | null;
  accountName: string | null;
  accountReference: string | null;
  paymentUrl: string | null;
  instructions: string;
  supportLabel: string;
  supportContact: string | null;
  supportUrl: string | null;
  proofImageMaxBytes: number;
  payloadMaxBytes: number;
};
