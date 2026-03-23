import { createApp } from "./app";
import type { AppBindings } from "./core/types/app";
import {
  handleSupportRealtimeDurableObjectRequest,
  SupportChatHub,
} from "./modules/support/realtime/support-realtime";

const app = createApp("cloudflare-worker");
type WorkerExecutionContext = {
  waitUntil: (promise: Promise<unknown>) => void;
  passThroughOnException: () => void;
  props: unknown;
};

export default {
  async fetch(
    request: Request,
    env: unknown,
    ctx: unknown,
  ) {
    const realtimeResponse =
      env &&
      typeof env === "object" &&
      "SUPPORT_CHAT_HUB" in env &&
      (env as { SUPPORT_CHAT_HUB?: AppBindings["Bindings"]["SUPPORT_CHAT_HUB"] })
        .SUPPORT_CHAT_HUB
        ? await handleSupportRealtimeDurableObjectRequest(
            request,
            (env as { SUPPORT_CHAT_HUB: AppBindings["Bindings"]["SUPPORT_CHAT_HUB"] })
              .SUPPORT_CHAT_HUB!,
          )
        : null;
    if (realtimeResponse) {
      return realtimeResponse;
    }

    const executionContext: WorkerExecutionContext =
      typeof ctx === "object" && ctx !== null
        ? ({
            waitUntil:
              typeof (ctx as { waitUntil?: unknown }).waitUntil === "function"
                ? ((ctx as { waitUntil: (promise: Promise<unknown>) => void }).waitUntil)
                : () => undefined,
            passThroughOnException:
              typeof (ctx as { passThroughOnException?: unknown }).passThroughOnException ===
              "function"
                ? ((ctx as { passThroughOnException: () => void }).passThroughOnException)
                : () => undefined,
            props: (ctx as { props?: unknown }).props ?? null,
          } satisfies WorkerExecutionContext)
        : {
            waitUntil: () => undefined,
            passThroughOnException: () => undefined,
            props: null,
          };

    return app.fetch(request, env, executionContext);
  },
};

export { SupportChatHub };
