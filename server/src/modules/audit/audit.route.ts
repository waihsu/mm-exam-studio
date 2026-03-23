import { Hono } from "hono";
import type { AppBindings } from "@/core/types/app";
import { requireRoles } from "@/middlewares/rbac";
import { auditAlertsRoute } from "./routes/alerts.route";
import { auditLogsRoute } from "./routes/logs.route";

export const auditRoute = new Hono<AppBindings>();

auditRoute.use("*", requireRoles("admin", "superadmin"));
auditRoute.route("/", auditLogsRoute);
auditRoute.route("/", auditAlertsRoute);

