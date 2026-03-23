import { apiRequest } from "@/lib/api-client";
import type {
  CreateSubscriptionRequestInput,
  CurrentSubscriptionRequestResponse,
  SubscriptionPlan,
  SubscriptionPaymentConfig,
  SubscriptionRequestListResponse,
  SubscriptionRequest,
} from "../types/subscription.types";

export const getSubscriptionPlans = () =>
  apiRequest<SubscriptionPlan[]>("/api/v1/subscriptions/plans");

export const getSubscriptionPaymentConfig = () =>
  apiRequest<SubscriptionPaymentConfig>("/api/v1/subscriptions/payment-config");

export const getCurrentSubscriptionRequest = () =>
  apiRequest<CurrentSubscriptionRequestResponse>("/api/v1/subscriptions/my/request");

export const getOwnSubscriptionRequests = () =>
  apiRequest<SubscriptionRequestListResponse>("/api/v1/subscriptions/my/requests");

export const createSubscriptionRequest = (payload: CreateSubscriptionRequestInput) =>
  apiRequest<SubscriptionRequest>("/api/v1/subscriptions/my/requests", {
    method: "POST",
    body: payload,
  });

export const cancelSubscriptionRequest = (requestId: string) =>
  apiRequest<SubscriptionRequest>(`/api/v1/subscriptions/my/requests/${requestId}/cancel`, {
    method: "POST",
    body: {},
  });
