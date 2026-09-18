import { auth } from "@/lib/auth";
import { securityStore } from "@/lib/security-store";
import { getRequestClientIpKey } from "@/lib/request-client-ip";
import type { AppBindings, AppRole, AppUser } from "@/core/types/app";
import { resolveUserRoles } from "@/middlewares/rbac";
import type { Context } from "hono";
import {
  getAdminSupportConversationDetail,
  listAdminSupportConversationPage,
} from "../services/support-admin.service";
import { getMySupportConversation } from "../services/support-user.service";

const SUPPORT_REALTIME_PATH = "/api/v1/support/realtime";
const SUPPORT_CHAT_HUB_NAME = "support-chat-hub";
const textDecoder = new TextDecoder();
const textEncoder = new TextEncoder();

const readPositiveInt = (value: string | undefined, fallback: number) => {
  const parsed = Number.parseInt(String(value ?? ""), 10);
  if (!Number.isFinite(parsed) || parsed < 1) {
    return fallback;
  }
  return parsed;
};

const supportRealtimeConnectPerMinute = readPositiveInt(
  process.env.SUPPORT_REALTIME_CONNECT_PER_MINUTE,
  20,
);
const supportRealtimeConnectPerHour = readPositiveInt(
  process.env.SUPPORT_REALTIME_CONNECT_PER_HOUR,
  120,
);
const supportRealtimeMessagesPerMinute = readPositiveInt(
  process.env.SUPPORT_REALTIME_MESSAGES_PER_MINUTE,
  60,
);
const supportRealtimeMaxSubscriptions = readPositiveInt(
  process.env.SUPPORT_REALTIME_MAX_SUBSCRIPTIONS,
  8,
);
const supportRealtimeMaxMessageBytes = readPositiveInt(
  process.env.SUPPORT_REALTIME_MAX_MESSAGE_BYTES,
  8_192,
);
const supportRealtimeMaxInvalidMessages = readPositiveInt(
  process.env.SUPPORT_REALTIME_MAX_INVALID_MESSAGES,
  4,
);

declare const WebSocketPair:
  | (new () => {
      0: WebSocket;
      1: WebSocket;
    })
  | undefined;

type WorkerRealtimeSocket = WebSocket & {
  accept(): void;
  addEventListener(
    type: "message" | "close",
    listener: (event: MessageEvent) => void,
  ): void;
};

export type SupportRealtimeAuthContext = {
  user: AppUser;
  roles: AppRole[];
};

type SupportRealtimeSubscription =
  | {
      key: "my-conversation";
      channel: "my-conversation";
    }
  | {
      key: "admin-conversations";
      channel: "admin-conversations";
      filters: {
        page: number;
        pageSize: number;
        search?: string;
        status?: "open" | "closed";
      };
    }
  | {
      key: `admin-conversation:${string}`;
      channel: "admin-conversation";
      conversationId: string;
    };

type SupportRealtimeClientEvent =
  | {
      type: "ping";
    }
  | {
      type: "sync";
    }
  | {
      type: "unsubscribe";
      subscriptionKey: string;
    }
  | {
      type: "subscribe";
      channel: "my-conversation";
    }
  | {
      type: "subscribe";
      channel: "admin-conversations";
      filters?: {
        page?: number;
        pageSize?: number;
        search?: string;
        status?: string;
      };
    }
  | {
      type: "subscribe";
      channel: "admin-conversation";
      conversationId: string;
    };

type SupportRealtimeServerEvent =
  | {
      type: "ready";
      role: "user" | "admin";
    }
  | {
      type: "subscribed";
      subscriptionKey: string;
      channel: SupportRealtimeSubscription["channel"];
    }
  | {
      type: "unsubscribed";
      subscriptionKey: string;
    }
  | {
      type: "snapshot";
      subscriptionKey: string;
      channel: SupportRealtimeSubscription["channel"];
      data: unknown;
    }
  | {
      type: "pong";
      timestamp: string;
    }
  | {
      type: "error";
      message: string;
    };

type SupportRealtimeRefreshTarget =
  | {
      channel: "my-conversation";
      userId: string;
    }
  | {
      channel: "admin-conversations";
    }
  | {
      channel: "admin-conversation";
      conversationId: string;
    };

const hasAdminRole = (roles: AppRole[]) =>
  roles.includes("admin") || roles.includes("superadmin");

const jsonResponse = (payload: unknown, status = 200) =>
  Response.json(payload, { status });

const normalizePositiveNumber = (value: unknown, fallback: number) => {
  const parsed =
    typeof value === "number"
      ? value
      : Number.parseInt(String(value ?? ""), 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }
  return Math.trunc(parsed);
};

const decodeSocketMessage = (raw: unknown) => {
  if (typeof raw === "string") {
    return raw;
  }

  if (raw instanceof ArrayBuffer) {
    return textDecoder.decode(raw);
  }

  if (ArrayBuffer.isView(raw)) {
    return textDecoder.decode(
      new Uint8Array(raw.buffer, raw.byteOffset, raw.byteLength),
    );
  }

  return "";
};

const measureSocketMessageBytes = (raw: unknown) => {
  if (typeof raw === "string") {
    return textEncoder.encode(raw).byteLength;
  }
  if (raw instanceof ArrayBuffer) {
    return raw.byteLength;
  }
  if (ArrayBuffer.isView(raw)) {
    return raw.byteLength;
  }
  return 0;
};

const parseSocketEvent = (raw: unknown): SupportRealtimeClientEvent => {
  const decoded = decodeSocketMessage(raw).trim();
  if (!decoded) {
    throw new Error("Empty realtime message.");
  }

  const payload = JSON.parse(decoded) as SupportRealtimeClientEvent;
  if (!payload || typeof payload !== "object" || typeof payload.type !== "string") {
    throw new Error("Invalid realtime payload.");
  }

  return payload;
};

const buildSubscription = (
  event: SupportRealtimeClientEvent,
  roles: AppRole[],
): SupportRealtimeSubscription => {
  if (event.type !== "subscribe") {
    throw new Error("Unsupported subscription payload.");
  }

  if (event.channel === "my-conversation") {
    return {
      key: "my-conversation",
      channel: "my-conversation",
    };
  }

  if (!hasAdminRole(roles)) {
    throw new Error("Admin permission is required for this realtime channel.");
  }

  if (event.channel === "admin-conversations") {
    const status =
      event.filters?.status === "open" || event.filters?.status === "closed"
        ? event.filters.status
        : undefined;

    const search =
      typeof event.filters?.search === "string" && event.filters.search.trim().length > 0
        ? event.filters.search.trim()
        : undefined;

    return {
      key: "admin-conversations",
      channel: "admin-conversations",
      filters: {
        page: normalizePositiveNumber(event.filters?.page, 1),
        pageSize: Math.min(50, normalizePositiveNumber(event.filters?.pageSize, 50)),
        ...(status ? { status } : {}),
        ...(search ? { search } : {}),
      },
    };
  }

  const conversationId =
    typeof event.conversationId === "string" ? event.conversationId.trim() : "";
  if (!conversationId) {
    throw new Error("A conversation id is required.");
  }

  return {
    key: `admin-conversation:${conversationId}`,
    channel: "admin-conversation",
    conversationId,
  };
};

const snapshotSubscription = async (
  authContext: SupportRealtimeAuthContext,
  subscription: SupportRealtimeSubscription,
) => {
  if (subscription.channel === "my-conversation") {
    return getMySupportConversation(authContext.user.id);
  }

  if (subscription.channel === "admin-conversations") {
    if (!hasAdminRole(authContext.roles)) {
      throw new Error("Admin permission is required for this realtime channel.");
    }

    return listAdminSupportConversationPage(subscription.filters);
  }

  if (!hasAdminRole(authContext.roles)) {
    throw new Error("Admin permission is required for this realtime channel.");
  }

  return getAdminSupportConversationDetail(subscription.conversationId);
};

const resolveRealtimeAuthContext = async (
  request: Request,
): Promise<SupportRealtimeAuthContext> => {
  const session = await auth.api.getSession({
    headers: request.headers,
  });

  if (!session?.user || !session.session) {
    throw new Error("Authentication required.");
  }

  const user = session.user as AppUser;
  const roles = await resolveUserRoles(user);

  return {
    user,
    roles,
  };
};

const serializeRealtimeAuthHeaders = (authContext: SupportRealtimeAuthContext) => {
  const headers = new Headers();
  headers.set("x-support-user-id", authContext.user.id);
  headers.set("x-support-user-roles", authContext.roles.join(","));
  return headers;
};

const readRealtimeAuthContextFromHeaders = (
  request: Request,
): SupportRealtimeAuthContext => {
  const userId = request.headers.get("x-support-user-id")?.trim() ?? "";
  if (!userId) {
    throw new Error("Missing support realtime user id.");
  }

  const roles = (request.headers.get("x-support-user-roles") ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter((item): item is AppRole =>
      item === "student" ||
      item === "instructor" ||
      item === "admin" ||
      item === "superadmin",
    );

  return {
    user: { id: userId },
    roles,
  };
};

export const isSupportRealtimeRequest = (request: Request) => {
  const pathname = new URL(request.url).pathname.replace(/\/+$/, "");
  return pathname === SUPPORT_REALTIME_PATH;
};

export const authenticateSupportRealtimeRequest = async (request: Request) => {
  if ((request.headers.get("upgrade") ?? "").toLowerCase() !== "websocket") {
    return {
      ok: false as const,
      response: jsonResponse({ message: "WebSocket upgrade required." }, 426),
    };
  }

  let authContext: SupportRealtimeAuthContext;
  try {
    authContext = await resolveRealtimeAuthContext(request);
  } catch (error) {
    return {
      ok: false as const,
      response: jsonResponse(
        {
          message:
            error instanceof Error && error.message.trim().length > 0
              ? error.message
              : "Authentication required.",
        },
        401,
      ),
    };
  }

  try {
    const now = Date.now();
    const ip = getRequestClientIpKey(request);

    for (const window of [
      { windowMs: 60_000, max: supportRealtimeConnectPerMinute },
      { windowMs: 3_600_000, max: supportRealtimeConnectPerHour },
    ]) {
      const counter = await securityStore.incrementRateLimit(
        `support-ws:connect:${ip}:${authContext.user.id}:${window.windowMs}`,
        window.windowMs,
        now,
      );

      if (counter.count > window.max) {
        const response = jsonResponse(
          { message: "Too many realtime connection attempts. Please wait and try again." },
          429,
        );
        response.headers.set(
          "retry-after",
          String(Math.ceil((counter.resetAt - now) / 1000)),
        );
        response.headers.set("x-rate-limit-scope", "support-realtime-connect");
        return {
          ok: false as const,
          response,
        };
      }
    }
  } catch (error) {
    console.warn(
      "[support-realtime] connect rate-limit check failed:",
      error instanceof Error ? error.message : error,
    );
  }

  return {
    ok: true as const,
    authContext,
  };
};

export class SupportRealtimeSocketSession {
  private readonly subscriptions = new Map<string, SupportRealtimeSubscription>();
  private messageWindowStartedAt = Date.now();
  private messageCount = 0;
  private invalidMessageCount = 0;

  constructor(
    private readonly authContext: SupportRealtimeAuthContext,
    private readonly send: (event: SupportRealtimeServerEvent) => void,
    private readonly close?: (code: number, reason: string) => void,
  ) {}

  onOpen() {
    this.send({
      type: "ready",
      role: hasAdminRole(this.authContext.roles) ? "admin" : "user",
    });
  }

  onClose() {
    this.subscriptions.clear();
  }

  async refreshMatchingTargets(targets: SupportRealtimeRefreshTarget[]) {
    for (const subscription of this.subscriptions.values()) {
      if (!this.matchesAnyTarget(subscription, targets)) {
        continue;
      }
      await this.sendSnapshot(subscription);
    }
  }

  async onMessage(raw: unknown) {
    if (measureSocketMessageBytes(raw) > supportRealtimeMaxMessageBytes) {
      this.send({
        type: "error",
        message: "Realtime payload is too large.",
      });
      this.close?.(1009, "Realtime payload is too large.");
      return;
    }

    if (!this.consumeMessageAllowance()) {
      this.send({
        type: "error",
        message: "Too many realtime messages. Please slow down.",
      });
      this.close?.(1008, "Too many realtime messages.");
      return;
    }

    try {
      const event = parseSocketEvent(raw);
      this.invalidMessageCount = 0;

      if (event.type === "ping") {
        this.send({
          type: "pong",
          timestamp: new Date().toISOString(),
        });
        return;
      }

      if (event.type === "subscribe") {
        const subscription = buildSubscription(event, this.authContext.roles);
        if (
          !this.subscriptions.has(subscription.key) &&
          this.subscriptions.size >= supportRealtimeMaxSubscriptions
        ) {
          throw new Error("Too many realtime subscriptions on one socket.");
        }
        this.subscriptions.set(subscription.key, subscription);
        this.send({
          type: "subscribed",
          subscriptionKey: subscription.key,
          channel: subscription.channel,
        });
        await this.sendSnapshot(subscription);
        return;
      }

      if (event.type === "unsubscribe") {
        this.subscriptions.delete(event.subscriptionKey);
        this.send({
          type: "unsubscribed",
          subscriptionKey: event.subscriptionKey,
        });
        return;
      }

      if (event.type === "sync") {
        for (const subscription of this.subscriptions.values()) {
          await this.sendSnapshot(subscription);
        }
      }
    } catch (error) {
      this.invalidMessageCount += 1;
      this.send({
        type: "error",
        message:
          error instanceof Error && error.message.trim().length > 0
            ? error.message
            : "Realtime message handling failed.",
      });

      if (this.invalidMessageCount >= supportRealtimeMaxInvalidMessages) {
        this.close?.(1008, "Too many invalid realtime messages.");
      }
    }
  }

  private consumeMessageAllowance() {
    const now = Date.now();
    if (this.messageWindowStartedAt + 60_000 <= now) {
      this.messageWindowStartedAt = now;
      this.messageCount = 0;
    }

    this.messageCount += 1;
    return this.messageCount <= supportRealtimeMessagesPerMinute;
  }

  private async sendSnapshot(subscription: SupportRealtimeSubscription) {
    const data = await snapshotSubscription(this.authContext, subscription);
    this.send({
      type: "snapshot",
      subscriptionKey: subscription.key,
      channel: subscription.channel,
      data,
    });
  }

  private matchesAnyTarget(
    subscription: SupportRealtimeSubscription,
    targets: SupportRealtimeRefreshTarget[],
  ) {
    return targets.some((target) => {
      if (subscription.channel === "my-conversation" && target.channel === "my-conversation") {
        return this.authContext.user.id === target.userId;
      }

      if (
        subscription.channel === "admin-conversations" &&
        target.channel === "admin-conversations"
      ) {
        return hasAdminRole(this.authContext.roles);
      }

      if (
        subscription.channel === "admin-conversation" &&
        target.channel === "admin-conversation"
      ) {
        return subscription.conversationId === target.conversationId;
      }

      return false;
    });
  }
}

export const handleSupportRealtimeWorkerRequest = async (request: Request) => {
  if (!isSupportRealtimeRequest(request)) {
    return null;
  }

  const authResult = await authenticateSupportRealtimeRequest(request);
  if (!authResult.ok) {
    return authResult.response;
  }

  const Pair = WebSocketPair as unknown as new () => {
    0: WorkerRealtimeSocket;
    1: WorkerRealtimeSocket;
  };
  const pair = new Pair();
  const client = pair[0];
  const server = pair[1];
  const session = new SupportRealtimeSocketSession(authResult.authContext, (event) => {
    server.send(JSON.stringify(event));
  }, (code, reason) => {
    server.close(code, reason);
  });

  server.accept();
  session.onOpen();
  server.addEventListener("message", (event: MessageEvent) => {
    void session.onMessage(event.data);
  });
  server.addEventListener("close", () => {
    session.onClose();
  });

  return new Response(null, {
    status: 101,
    webSocket: client,
  } as ResponseInit & { webSocket: WebSocket });
};

type SupportChatHubSocketAttachment = {
  authContext: SupportRealtimeAuthContext;
};

type SupportChatHubContext = {
  acceptWebSocket?: (socket: WebSocket) => void;
  getWebSockets?: () => WebSocket[];
};

export class SupportChatHub {
  private readonly sessions = new WeakMap<WebSocket, SupportRealtimeSocketSession>();

  constructor(
    private readonly ctx: SupportChatHubContext,
  ) {}

  async fetch(request: Request) {
    const url = new URL(request.url);

    if ((request.headers.get("upgrade") ?? "").toLowerCase() === "websocket") {
      const authContext = readRealtimeAuthContextFromHeaders(request);
      const Pair = WebSocketPair as unknown as new () => {
        0: WorkerRealtimeSocket & {
          serializeAttachment?: (value: SupportChatHubSocketAttachment) => void;
        };
        1: WorkerRealtimeSocket & {
          serializeAttachment?: (value: SupportChatHubSocketAttachment) => void;
        };
      };
      const pair = new Pair();
      const client = pair[0];
      const server = pair[1];

      server.serializeAttachment?.({ authContext });
      this.ctx.acceptWebSocket?.(server);

      this.sessionForSocket(server).onOpen();

      return new Response(null, {
        status: 101,
        webSocket: client,
      } as ResponseInit & { webSocket: WebSocket });
    }

    if (request.method === "POST" && url.pathname.endsWith("/notify")) {
      const payload = (await request.json().catch(() => null)) as {
        targets?: SupportRealtimeRefreshTarget[];
      } | null;
      const targets = Array.isArray(payload?.targets) ? payload.targets : [];
      await this.broadcastTargets(targets);
      return jsonResponse({ ok: true });
    }

    return jsonResponse({ message: "Not found" }, 404);
  }

  async webSocketMessage(ws: WebSocket, message: string | ArrayBuffer) {
    await this.sessionForSocket(ws).onMessage(message);
  }

  webSocketClose(ws: WebSocket) {
    this.sessionForSocket(ws).onClose();
    this.sessions.delete(ws);
  }

  private sessionForSocket(ws: WebSocket) {
    const existing = this.sessions.get(ws);
    if (existing) {
      return existing;
    }

    const attachment = (
      ws as WebSocket & {
        deserializeAttachment?: () => SupportChatHubSocketAttachment | null;
      }
    ).deserializeAttachment?.();

    const authContext = attachment?.authContext;
    if (!authContext) {
      throw new Error("Missing support realtime socket auth context.");
    }

    const session = new SupportRealtimeSocketSession(authContext, (event) => {
      ws.send(JSON.stringify(event));
    }, (code, reason) => {
      ws.close(code, reason);
    });
    this.sessions.set(ws, session);
    return session;
  }

  private async broadcastTargets(targets: SupportRealtimeRefreshTarget[]) {
    const sockets = this.ctx.getWebSockets?.() ?? [];
    for (const socket of sockets) {
      try {
        await this.sessionForSocket(socket).refreshMatchingTargets(targets);
      } catch {
        this.sessions.delete(socket);
      }
    }
  }
}

export const handleSupportRealtimeDurableObjectRequest = async (
  request: Request,
  supportChatHub: NonNullable<AppBindings["Bindings"]["SUPPORT_CHAT_HUB"]>,
) => {
  if (!isSupportRealtimeRequest(request)) {
    return null;
  }

  const authResult = await authenticateSupportRealtimeRequest(request);
  if (!authResult.ok) {
    return authResult.response;
  }

  const id = supportChatHub.idFromName(SUPPORT_CHAT_HUB_NAME);
  const stub = supportChatHub.get(id);
  const headers = new Headers(request.headers);
  const authHeaders = serializeRealtimeAuthHeaders(authResult.authContext);
  for (const [key, value] of authHeaders.entries()) {
    headers.set(key, value);
  }

  return stub.fetch(
    new Request(request, {
      headers,
    }),
  );
};

export const notifySupportRealtimeTargets = async (
  c: Context<AppBindings>,
  targets: SupportRealtimeRefreshTarget[],
) => {
  const supportChatHub = c.env?.SUPPORT_CHAT_HUB;
  if (!supportChatHub || targets.length === 0) {
    return;
  }

  const id = supportChatHub.idFromName(SUPPORT_CHAT_HUB_NAME);
  const stub = supportChatHub.get(id);
  await stub.fetch("https://support-chat-hub.internal/notify", {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({ targets }),
  });
};
