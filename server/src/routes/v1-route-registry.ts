import type { AppBindings } from "@/core/types/app";
import type { Hono } from "hono";
import { auditRoute } from "@/modules/audit/audit.route";
import { questionRoute } from "@/modules/questions/question.route";
import { supportRoute } from "@/modules/support/support.route";
import { subscriptionRoute } from "@/modules/subscriptions/subscription.route";
import { taxonomyRoute } from "@/modules/taxonomy/taxonomy.route";
import { usersRoute } from "@/modules/users/users.route";
import { workspaceRoute } from "@/modules/workspace/workspace.route";

export type V1RouteRegistration = {
  path: string;
  route: Hono<AppBindings>;
};

export const v1RouteRegistry: V1RouteRegistration[] = [
  {
    path: "/workspace",
    route: workspaceRoute,
  },
  {
    path: "/subscriptions",
    route: subscriptionRoute,
  },
  {
    path: "/support",
    route: supportRoute,
  },
  {
    path: "/users",
    route: usersRoute,
  },
  {
    path: "/questions",
    route: questionRoute,
  },
  {
    path: "/taxonomy",
    route: taxonomyRoute,
  },
  {
    path: "/audit",
    route: auditRoute,
  },
];
