import { Hono } from "hono";
import type { AppBindings } from "@/core/types/app";
import {
  parseJsonBodyWithSchema,
  readPositiveNumberParam,
} from "@/lib/route-utils";
import {
  updateSubscriptionByAdminSchema,
} from "../subscription.schema";
import {
  getAdminSubscriptionPage,
  updateSubscriptionByAdmin,
} from "../services/subscription-admin.service";
import { toSubscriptionHttpError } from "../route-utils";

export const subscriptionAdminUsersRoute = new Hono<AppBindings>();

subscriptionAdminUsersRoute.get("/admin/users", async (c) => {
  const planCode = c.req.query("planCode");
  const status = c.req.query("status");

  const result = await getAdminSubscriptionPage({
    page: readPositiveNumberParam(c.req.query("page"), 1),
    pageSize: readPositiveNumberParam(c.req.query("pageSize"), 20),
    search: c.req.query("search") ?? undefined,
    planCode:
      planCode === "free" || planCode === "pro" || planCode === "premium"
        ? planCode
        : undefined,
    status:
      status === "active" ||
      status === "canceled" ||
      status === "past_due" ||
      status === "expired"
        ? status
        : undefined,
  });

  return c.json(result);
});

subscriptionAdminUsersRoute.put("/admin/users/:userId", async (c) => {
  const payload = await parseJsonBodyWithSchema(c.req.raw, updateSubscriptionByAdminSchema);

  try {
    const result = await updateSubscriptionByAdmin(c.req.param("userId"), payload);
    return c.json(result);
  } catch (error) {
    toSubscriptionHttpError(error, "Failed to update subscription.");
  }
});

