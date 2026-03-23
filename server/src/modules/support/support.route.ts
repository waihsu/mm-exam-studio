import { Hono } from "hono";
import type { AppBindings } from "@/core/types/app";
import { requireAuth, requireRoles } from "@/middlewares/rbac";
import { supportAdminRoute } from "./routes/admin-support.route";
import { supportMyRoute } from "./routes/my-support.route";

export const supportRoute = new Hono<AppBindings>();

supportRoute.use("*", requireAuth);
supportRoute.use("/admin/*", requireRoles("admin", "superadmin"));

supportRoute.route("/", supportMyRoute);
supportRoute.route("/", supportAdminRoute);
