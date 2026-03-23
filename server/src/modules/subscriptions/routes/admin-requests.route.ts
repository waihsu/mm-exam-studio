import { Hono } from "hono";
import type { AppBindings } from "@/core/types/app";
import { sendExpoPushToUsers } from "@/modules/notifications/services/expo-push.service";
import {
  parseJsonBodyWithSchema,
  readPositiveNumberParam,
} from "@/lib/route-utils";
import { ensureAuthContext } from "@/middlewares/rbac";
import {
  reviewSubscriptionRequestSchema,
} from "../subscription.schema";
import {
  getAdminSubscriptionRequestDetail,
  getAdminSubscriptionRequestPage,
  reviewSubscriptionRequest,
} from "../services/subscription-admin.service";
import { toSubscriptionHttpError } from "../route-utils";

export const subscriptionAdminRequestsRoute = new Hono<AppBindings>();

const formatPlanLabel = (planCode: "free" | "pro" | "premium") => {
  if (planCode === "pro") {
    return "Pro";
  }

  if (planCode === "premium") {
    return "Premium";
  }

  return "Free";
};

subscriptionAdminRequestsRoute.get("/admin/requests/:requestId", async (c) => {
  try {
    const result = await getAdminSubscriptionRequestDetail(c.req.param("requestId"));
    return c.json(result);
  } catch (error) {
    toSubscriptionHttpError(error, "Failed to load subscription request.");
  }
});

subscriptionAdminRequestsRoute.get("/admin/requests", async (c) => {
  const status = c.req.query("status");
  const planCode = c.req.query("planCode");

  const result = await getAdminSubscriptionRequestPage({
    page: readPositiveNumberParam(c.req.query("page"), 1),
    pageSize: readPositiveNumberParam(c.req.query("pageSize"), 20),
    search: c.req.query("search") ?? undefined,
    status:
      status === "pending" ||
      status === "approved" ||
      status === "rejected" ||
      status === "canceled"
        ? status
        : undefined,
    planCode:
      planCode === "free" || planCode === "pro" || planCode === "premium"
        ? planCode
        : undefined,
  });

  return c.json(result);
});

subscriptionAdminRequestsRoute.post("/admin/requests/:requestId/review", async (c) => {
  const { user } = await ensureAuthContext(c);
  const payload = await parseJsonBodyWithSchema(c.req.raw, reviewSubscriptionRequestSchema);

  try {
    const result = await reviewSubscriptionRequest(
      c.req.param("requestId"),
      user.id,
      payload,
    );
    const requestedPlanLabel = formatPlanLabel(result.request.requestedPlanCode);
    await sendExpoPushToUsers({
      userIds: result.request.user?.id ? [result.request.user.id] : [],
      title:
        result.request.status === "approved"
          ? "Subscription approved"
          : "Subscription update needed",
      body:
        result.request.status === "approved"
          ? `Your ${requestedPlanLabel} plan is now active.`
          : result.request.adminNote?.trim() ||
            `Your ${requestedPlanLabel} request needs another review. Open subscription for details.`,
      data: {
        kind: "subscription-request-reviewed",
        requestId: result.request.id,
        decision: result.request.status,
      },
    }).catch((error) => {
      console.warn(
        `[push] subscription review push failed: ${
          error instanceof Error ? error.message : "unknown error"
        }`,
      );
    });
    return c.json(result);
  } catch (error) {
    toSubscriptionHttpError(error, "Failed to review subscription request.");
  }
});
