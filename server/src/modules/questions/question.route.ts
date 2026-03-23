import { Hono } from "hono";
import type { AppBindings } from "@/core/types/app";
import { requireRoles } from "@/middlewares/rbac";
import { questionCollectionRoute } from "./routes/collection.route";
import { questionItemRoute } from "./routes/item.route";
import { questionMetaPreviewRoute } from "./routes/meta-preview.route";

export const questionRoute = new Hono<AppBindings>();

questionRoute.use("*", requireRoles("admin", "superadmin"));
questionRoute.route("/", questionMetaPreviewRoute);
questionRoute.route("/", questionCollectionRoute);
questionRoute.route("/", questionItemRoute);

