type PlanCode = "free" | "pro" | "premium";
type SubscriptionRequestStatus = "pending" | "approved" | "rejected" | "canceled";

export const mapSubscriptionRequest = (
  request: {
    id: string;
    requestedPlanCode: PlanCode;
    status: SubscriptionRequestStatus;
    transactionId: string | null;
    paymentProofImageDataUrl: string | null;
    note: string | null;
    adminNote: string | null;
    reviewedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
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
  },
  options: {
    includePaymentProofImage?: boolean;
  } = {},
) => ({
  id: request.id,
  requestedPlanCode: request.requestedPlanCode,
  status: request.status,
  transactionId: request.transactionId,
  hasPaymentProof: Boolean(request.paymentProofImageDataUrl),
  ...(options.includePaymentProofImage
    ? {
        paymentProofImageDataUrl: request.paymentProofImageDataUrl,
      }
    : {}),
  note: request.note,
  adminNote: request.adminNote,
  reviewedAt: request.reviewedAt,
  createdAt: request.createdAt,
  updatedAt: request.updatedAt,
  user: request.user
    ? {
        id: request.user.id,
        name: request.user.name,
        email: request.user.email,
      }
    : undefined,
  reviewer: request.reviewer
    ? {
        id: request.reviewer.id,
        name: request.reviewer.name,
        email: request.reviewer.email,
      }
    : null,
});

export type {
  PlanCode,
  SubscriptionRequestStatus,
};

