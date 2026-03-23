import { Hono } from "hono";
import type { AppBindings } from "@/core/types/app";
import { listSuspiciousSignInAlerts } from "../audit.service";
import { readPositiveNumberParam } from "../route-utils";

export const auditAlertsRoute = new Hono<AppBindings>();

auditAlertsRoute.get("/alerts/suspicious-signins", async (c) => {
  const limit = Math.min(
    100,
    readPositiveNumberParam(c.req.query("limit"), 20),
  );
  const minRiskScore = Math.min(
    100,
    readPositiveNumberParam(c.req.query("minRiskScore"), 60),
  );

  const result = await listSuspiciousSignInAlerts({
    limit,
    minRiskScore,
  });

  return c.json(result);
});

