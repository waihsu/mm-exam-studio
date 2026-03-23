import { Hono } from "hono";
import type { AppBindings } from "@/core/types/app";
import { workspacePaperCoreRoute } from "./paper-core.route";
import { workspacePaperExportRoute } from "./paper-export.route";
import { workspacePaperItemsRoute } from "./paper-items.route";

export const workspacePaperRoute = new Hono<AppBindings>();

workspacePaperRoute.route("/", workspacePaperCoreRoute);
workspacePaperRoute.route("/", workspacePaperItemsRoute);
workspacePaperRoute.route("/", workspacePaperExportRoute);

