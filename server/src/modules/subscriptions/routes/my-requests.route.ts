import { Hono } from "hono";
import type { AppBindings } from "@/core/types/app";
import {
  assertContentLengthWithin,
  parseJsonBodyWithSchema,
} from "@/lib/route-utils";
import { createEndpointRateLimitMiddleware } from "@/middlewares/endpoint-rate-limit";
import { ensureAuthContext } from "@/middlewares/rbac";
import { createSubscriptionRequestSchema } from "../subscription.schema";
import {
  cancelSubscriptionRequest,
  createSubscriptionRequest,
  getCurrentSubscriptionRequest,
  listOwnSubscriptionRequests,
} from "../services/subscription-my-request.service";
import { SUBSCRIPTION_PAYMENT_PAYLOAD_MAX_BYTES } from "../services/subscription-payment-config.service";
import { toSubscriptionHttpError } from "../route-utils";

export const subscriptionMyRequestsRoute = new Hono<AppBindings>();

const readPositiveInt = (value: string | undefined, fallback: number) => {
  const parsed = Number.parseInt(String(value ?? ""), 10);
  if (!Number.isFinite(parsed) || parsed < 1) {
    return fallback;
  }
  return parsed;
};

subscriptionMyRequestsRoute.get("/my/requests", async (c) => {
  const { user } = await ensureAuthContext(c);
  const result = await listOwnSubscriptionRequests(user.id);
  return c.json(result);
});

subscriptionMyRequestsRoute.get("/my/request", async (c) => {
  const { user } = await ensureAuthContext(c);
  const result = await getCurrentSubscriptionRequest(user.id);
  return c.json({ data: result });
});

subscriptionMyRequestsRoute.post(
  "/my/requests",
  createEndpointRateLimitMiddleware({
    namespace: "subscriptions",
    keyId: "my-request-create",
    windows: [
      {
        windowMs: readPositiveInt(
          process.env.SUBSCRIPTION_REQUEST_CREATE_COOLDOWN_MS,
          600_000,
        ),
        max: readPositiveInt(
          process.env.SUBSCRIPTION_REQUEST_CREATE_COOLDOWN_MAX,
          1,
        ),
      },
    ],
    message:
      "A recent subscription request was already submitted. Please wait before trying again.",
  }),
  async (c) => {
    const { user } = await ensureAuthContext(c);
    assertContentLengthWithin(
      c.req.raw,
      SUBSCRIPTION_PAYMENT_PAYLOAD_MAX_BYTES,
      "Subscription request payload is too large.",
    );
    const payload = await parseJsonBodyWithSchema(c.req.raw, createSubscriptionRequestSchema);

    try {
      const result = await createSubscriptionRequest(user.id, payload);
      return c.json(result, 201);
    } catch (error) {
      toSubscriptionHttpError(error, "Failed to create subscription request.");
    }
  },
);

subscriptionMyRequestsRoute.post("/my/requests/:requestId/cancel", async (c) => {
  const { user } = await ensureAuthContext(c);

  try {
    const result = await cancelSubscriptionRequest(user.id, c.req.param("requestId"));
    return c.json(result);
  } catch (error) {
    toSubscriptionHttpError(error, "Failed to cancel subscription request.");
  }
});
