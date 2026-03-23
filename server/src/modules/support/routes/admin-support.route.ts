import { Hono } from "hono";
import type { AppBindings } from "@/core/types/app";
import { sendExpoPushToUsers } from "@/modules/notifications/services/expo-push.service";
import {
  parseJsonBodyWithSchema,
  readPositiveNumberParam,
} from "@/lib/route-utils";
import { ensureAuthContext } from "@/middlewares/rbac";
import { notifySupportRealtimeTargets } from "../realtime/support-realtime";
import {
  createSupportMessageSchema,
  updateSupportConversationSettingsSchema,
} from "../support.schema";
import {
  createAdminSupportMessage,
  getAdminSupportConversationDetail,
  listAdminSupportConversationPage,
  updateAdminSupportConversationSettings,
} from "../services/support-admin.service";
import { toSupportHttpError } from "../route-utils";

export const supportAdminRoute = new Hono<AppBindings>();

supportAdminRoute.get("/admin/conversations", async (c) => {
  const status = c.req.query("status");
  const result = await listAdminSupportConversationPage({
    page: readPositiveNumberParam(c.req.query("page"), 1),
    pageSize: readPositiveNumberParam(c.req.query("pageSize"), 20),
    search: c.req.query("search") ?? undefined,
    status: status === "open" || status === "closed" ? status : undefined,
  });

  return c.json(result);
});

supportAdminRoute.get("/admin/conversations/:conversationId", async (c) => {
  try {
    const result = await getAdminSupportConversationDetail(c.req.param("conversationId"));
    return c.json(result);
  } catch (error) {
    toSupportHttpError(error, "Failed to load support conversation.");
  }
});

supportAdminRoute.post("/admin/conversations/:conversationId/messages", async (c) => {
  try {
    const { user } = await ensureAuthContext(c);
    const payload = await parseJsonBodyWithSchema(c.req.raw, createSupportMessageSchema);
    const result = await createAdminSupportMessage(
      c.req.param("conversationId"),
      user.id,
      payload,
    );
    await notifySupportRealtimeTargets(c, [
      { channel: "my-conversation", userId: result.conversation.userId },
      { channel: "admin-conversations" },
      { channel: "admin-conversation", conversationId: result.conversation.id },
    ]);
    await sendExpoPushToUsers({
      userIds: [result.conversation.userId],
      title: "Support reply",
      body: payload.body,
      data: {
        kind: "support-reply",
        conversationId: result.conversation.id,
      },
    }).catch((error) => {
      console.warn(
        `[push] support reply push failed: ${
          error instanceof Error ? error.message : "unknown error"
        }`,
      );
    });
    return c.json(result, 201);
  } catch (error) {
    toSupportHttpError(error, "Failed to send support reply.");
  }
});

supportAdminRoute.post("/admin/conversations/:conversationId/status", async (c) => {
  try {
    const payload = await parseJsonBodyWithSchema(
      c.req.raw,
      updateSupportConversationSettingsSchema,
    );
    const result = await updateAdminSupportConversationSettings(
      c.req.param("conversationId"),
      payload,
    );
    await notifySupportRealtimeTargets(c, [
      { channel: "my-conversation", userId: result.userId },
      { channel: "admin-conversations" },
      { channel: "admin-conversation", conversationId: result.id },
    ]);
    return c.json(result);
  } catch (error) {
    toSupportHttpError(error, "Failed to update support conversation.");
  }
});
