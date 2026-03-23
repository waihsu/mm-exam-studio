import { Hono } from "hono";
import type { AppBindings } from "@/core/types/app";
import { getPlanCatalog } from "../services/subscription-catalog.service";
import { getSubscriptionPaymentConfig } from "../services/subscription-payment-config.service";

export const subscriptionPlansRoute = new Hono<AppBindings>();

subscriptionPlansRoute.get("/plans", async (c) => {
  const result = await getPlanCatalog();
  return c.json(result);
});

subscriptionPlansRoute.get("/payment-config", async (c) => {
  const result = getSubscriptionPaymentConfig();
  return c.json(result);
});
