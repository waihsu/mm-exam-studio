import { Hono } from "hono";
import type { AppBindings } from "@/core/types/app";
import { requireAuth } from "@/middlewares/rbac";
import { workspaceTrafficGuardMiddleware } from "@/middlewares/security";
import { workspaceBrandingRoute } from "./routes/branding.route";
import { workspaceCatalogRoute } from "./routes/catalog.route";
import { workspacePaperRoute } from "./routes/paper.route";
import { workspacePracticeRoute } from "./routes/practice.route";
import { workspaceSummaryRoute } from "./routes/summary.route";

export const workspaceRoute = new Hono<AppBindings>();

workspaceRoute.use("*", requireAuth);
workspaceRoute.use("*", workspaceTrafficGuardMiddleware);
workspaceRoute.route("/", workspaceSummaryRoute);
workspaceRoute.route("/", workspaceBrandingRoute);
workspaceRoute.route("/", workspaceCatalogRoute);
workspaceRoute.route("/", workspacePracticeRoute);
workspaceRoute.route("/", workspacePaperRoute);
