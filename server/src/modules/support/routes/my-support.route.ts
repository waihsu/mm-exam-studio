import { Hono } from "hono";
import type { AppBindings } from "@/core/types/app";
import { parseJsonBodyWithSchema } from "@/lib/route-utils";
import { createEndpointRateLimitMiddleware } from "@/middlewares/endpoint-rate-limit";
import { ensureAuthContext } from "@/middlewares/rbac";
import { createSupportMessageSchema } from "../support.schema";
import { notifySupportRealtimeTargets } from "../realtime/support-realtime";
import { toSupportHttpError } from "../route-utils";
import {
  createMySupportMessage,
  getMySupportConversation,
} from "../services/support-user.service";

export const supportMyRoute = new Hono<AppBindings>();

const readPositiveInt = (value: string | undefined, fallback: number) => {
  const parsed = Number.parseInt(String(value ?? ""), 10);
  if (!Number.isFinite(parsed) || parsed < 1) {
    return fallback;
  }
  return parsed;
};

supportMyRoute.get("/my/conversation", async (c) => {
  const { user } = await ensureAuthContext(c);
  const result = await getMySupportConversation(user.id);
  return c.json(result);
});

supportMyRoute.post(
  "/my/messages",
  createEndpointRateLimitMiddleware({
    namespace: "support",
    keyId: "my-messages",
    windows: [
      {
        windowMs: 60_000,
        max: readPositiveInt(process.env.SUPPORT_MESSAGE_RATE_LIMIT_PER_MINUTE, 5),
      },
      {
        windowMs: 3_600_000,
        max: readPositiveInt(process.env.SUPPORT_MESSAGE_RATE_LIMIT_PER_HOUR, 60),
      },
    ],
    message: "Too many support messages. Please wait before sending another message.",
  }),
  async (c) => {
    try {
      const { user } = await ensureAuthContext(c);
      const payload = await parseJsonBodyWithSchema(c.req.raw, createSupportMessageSchema);
      const result = await createMySupportMessage(user.id, payload);
      await notifySupportRealtimeTargets(c, [
        { channel: "my-conversation", userId: user.id },
        { channel: "admin-conversations" },
        { channel: "admin-conversation", conversationId: result.conversation.id },
      ]);
      return c.json(result, 201);
    } catch (error) {
      toSupportHttpError(error, "Failed to send support message.");
    }
  },
);
