import { Hono } from "hono";
import type { AppBindings } from "@/core/types/app";
import { requireRoles } from "@/middlewares/rbac";
import { taxonomyChaptersRoute } from "./routes/chapters.route";
import { taxonomyGradesRoute } from "./routes/grades.route";
import { taxonomyMetaRoute } from "./routes/meta.route";
import { taxonomySubjectsRoute } from "./routes/subjects.route";
import { taxonomySubChaptersRoute } from "./routes/sub-chapters.route";

export const taxonomyRoute = new Hono<AppBindings>();

taxonomyRoute.use("*", requireRoles("admin", "superadmin"));

taxonomyRoute.route("/", taxonomyMetaRoute);
taxonomyRoute.route("/", taxonomyGradesRoute);
taxonomyRoute.route("/", taxonomySubjectsRoute);
taxonomyRoute.route("/", taxonomyChaptersRoute);
taxonomyRoute.route("/", taxonomySubChaptersRoute);
