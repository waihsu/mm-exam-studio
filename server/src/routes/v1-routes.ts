import type { AppRole, AppSession, AppUser } from "@/core/types/app";
import { ensureAuthContext, requireAuth } from "@/middlewares/rbac";
import { Hono } from "hono";
import { v1RouteRegistry } from "./v1-route-registry";

const sanitizeMeUser = (user: AppUser) => ({
  id: typeof user.id === "string" ? user.id : "",
  name: typeof user.name === "string" ? user.name : null,
  email: typeof user.email === "string" ? user.email : null,
  emailVerified:
    typeof user.emailVerified === "boolean" ? user.emailVerified : null,
  twoFactorEnabled:
    typeof user.twoFactorEnabled === "boolean" ? user.twoFactorEnabled : false,
  image: typeof user.image === "string" ? user.image : null,
  accountStatus:
    user.accountStatus === "suspended" || user.accountStatus === "deactivated"
      ? user.accountStatus
      : "active",
  accountStatusChangedAt:
    typeof user.accountStatusChangedAt === "string"
      ? user.accountStatusChangedAt
      : null,
  createdAt: typeof user.createdAt === "string" ? user.createdAt : null,
  updatedAt: typeof user.updatedAt === "string" ? user.updatedAt : null,
});

const sanitizeMeSession = (session: AppSession) => ({
  id: typeof session.id === "string" ? session.id : null,
  expiresAt: typeof session.expiresAt === "string" ? session.expiresAt : null,
});

const sanitizeMeResponse = (params: {
  user: AppUser;
  session: AppSession;
  roles: AppRole[];
}) => ({
  user: sanitizeMeUser(params.user),
  session: sanitizeMeSession(params.session),
  roles: params.roles,
});

const registerProfileRoute = (app: Hono) => {
  app.get("/me", requireAuth, async (c) => {
    const { user, session, roles } = await ensureAuthContext(c);
    return c.json(sanitizeMeResponse({ user, session, roles }));
  });
};

export const v1Routes = (_runtime: "bun" | "cloudflare-worker") => {
  const app = new Hono();

  registerProfileRoute(app);
  for (const { path, route } of v1RouteRegistry) {
    app.route(path, route);
  }

  return app;
};
