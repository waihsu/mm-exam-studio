import { Hono } from "hono";
import type { AppBindings } from "@/core/types/app";
import { requireAuth, requireRoles } from "@/middlewares/rbac";
import { subscriptionAdminRequestsRoute } from "./routes/admin-requests.route";
import { subscriptionAdminUsersRoute } from "./routes/admin-users.route";
import { subscriptionMyRequestsRoute } from "./routes/my-requests.route";
import { subscriptionPlansRoute } from "./routes/plans.route";

export const subscriptionRoute = new Hono<AppBindings>();

subscriptionRoute.use("*", requireAuth);
subscriptionRoute.use("/admin/*", requireRoles("admin", "superadmin"));

subscriptionRoute.route("/", subscriptionPlansRoute);
subscriptionRoute.route("/", subscriptionMyRequestsRoute);
subscriptionRoute.route("/", subscriptionAdminUsersRoute);
subscriptionRoute.route("/", subscriptionAdminRequestsRoute);
