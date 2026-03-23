import { createApp } from "./app";
import {
  authenticateSupportRealtimeRequest,
  isSupportRealtimeRequest,
  type SupportRealtimeAuthContext,
  SupportRealtimeSocketSession,
} from "./modules/support/realtime/support-realtime";

const port = Number(process.env.PORT ?? 3000);
export const app = createApp("bun");

const server = Bun.serve<{
  authContext?: SupportRealtimeAuthContext;
  session?: SupportRealtimeSocketSession;
}>({
  port,
  fetch: async (request, server) => {
    if (isSupportRealtimeRequest(request)) {
      const authResult = await authenticateSupportRealtimeRequest(request);
      if (!authResult.ok) {
        return authResult.response;
      }

      const upgraded = server.upgrade(request, {
        data: {
          authContext: authResult.authContext,
        },
      });

      return upgraded
        ? undefined
        : Response.json({ message: "WebSocket upgrade failed." }, { status: 500 });
    }

    return app.fetch(request);
  },
  websocket: {
    open(ws) {
      const authContext = ws.data.authContext;
      if (!authContext) {
        ws.close(1011, "Missing auth context");
        return;
      }

      const session = new SupportRealtimeSocketSession(authContext, (event) => {
        ws.send(JSON.stringify(event));
      });
      ws.data.session = session;
      session.onOpen();
    },
    message(ws, message) {
      void ws.data.session?.onMessage(message);
    },
    close(ws) {
      ws.data.session?.onClose();
      ws.data.session = undefined;
    },
  },
});

console.log(`Hono is running at http://${server.hostname}:${server.port}`);
