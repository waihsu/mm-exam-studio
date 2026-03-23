import { Hono } from "hono";
import type { AppBindings } from "@/core/types/app";
import { requireAuth, requireRoles } from "@/middlewares/rbac";
import { userAdminRoute } from "./routes/admin-users.route";
import { userPushTokenRoute } from "./routes/my-push-tokens.route";

export const usersRoute = new Hono<AppBindings>();

usersRoute.use("*", requireAuth);
usersRoute.use("/admin/*", requireRoles("admin", "superadmin"));

usersRoute.route("/", userAdminRoute);
usersRoute.route("/", userPushTokenRoute);
