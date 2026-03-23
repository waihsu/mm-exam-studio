import { Hono } from "hono";
import type { AppBindings } from "@/core/types/app";
import { listAuditLogs } from "../audit.service";
import {
  parseDateParam,
  readPositiveNumberParam,
} from "../route-utils";

export const auditLogsRoute = new Hono<AppBindings>();

auditLogsRoute.get("/logs", async (c) => {
  const pageSize = Math.min(
    500,
    readPositiveNumberParam(c.req.query("pageSize"), 100),
  );

  const result = await listAuditLogs({
    q: c.req.query("q")?.trim() || undefined,
    action: c.req.query("action")?.trim() || undefined,
    actionPrefix: c.req.query("actionPrefix")?.trim() || undefined,
    entityType: c.req.query("entityType")?.trim() || undefined,
    actorUserId: c.req.query("actorUserId")?.trim() || undefined,
    from: parseDateParam(c.req.query("from"), "from"),
    to: parseDateParam(c.req.query("to"), "to"),
    page: readPositiveNumberParam(c.req.query("page"), 1),
    pageSize,
  });

  return c.json(result);
});

