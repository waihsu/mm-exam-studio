export type AppRuntime = "bun" | "cloudflare-worker";

let currentRuntime: AppRuntime = "bun";

const readGlobal = <T = unknown>(key: string) =>
  (globalThis as unknown as Record<string, T | undefined>)[key];

export const setAppRuntime = (runtime: AppRuntime) => {
  currentRuntime = runtime;
};

export const getAppRuntime = () => currentRuntime;

export const detectActualRuntime = (): AppRuntime => {
  if (typeof Bun !== "undefined") {
    return "bun";
  }

  const navigator = readGlobal<{ userAgent?: string }>("navigator");
  if (navigator?.userAgent === "Cloudflare-Workers") {
    return "cloudflare-worker";
  }

  if (typeof readGlobal("WebSocketPair") === "function") {
    return "cloudflare-worker";
  }

  return currentRuntime;
};

export const getResolvedAppRuntime = () => detectActualRuntime();

export const isCloudflareWorkerRuntime = () =>
  getResolvedAppRuntime() === "cloudflare-worker";

export const assertPdfGenerationAvailable = () => {
  if (isCloudflareWorkerRuntime()) {
    throw new Error(
      "Server-generated PDF is not available in the Cloudflare Worker runtime yet. Keep the API on the Bun/Node runtime for PDF export.",
    );
  }
};
