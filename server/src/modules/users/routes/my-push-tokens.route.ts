import { Hono } from "hono";
import type { AppBindings } from "@/core/types/app";
import { parseJsonBodyWithSchema } from "@/lib/route-utils";
import { ensureAuthContext } from "@/middlewares/rbac";
import {
  registerPushTokenSchema,
  unregisterPushTokenSchema,
} from "../users.schema";
import {
  registerPushTokenForUser,
  unregisterPushTokenForUser,
} from "../services/push-registration.service";

export const userPushTokenRoute = new Hono<AppBindings>();

userPushTokenRoute.post("/my/push-tokens/register", async (c) => {
  const { user } = await ensureAuthContext(c);
  const payload = await parseJsonBodyWithSchema(c.req.raw, registerPushTokenSchema);
  const result = await registerPushTokenForUser(user.id, payload);
  return c.json(result, 201);
});

userPushTokenRoute.post("/my/push-tokens/unregister", async (c) => {
  const { user } = await ensureAuthContext(c);
  const payload = await parseJsonBodyWithSchema(c.req.raw, unregisterPushTokenSchema);
  const result = await unregisterPushTokenForUser(user.id, payload);
  return c.json(result);
});
