import { createAuthClient } from "better-auth/react";

const configuredServerUrl = (import.meta.env.VITE_SERVER_URL ?? "")
  .trim()
  .replace(/\/+$/, "");
const runtimeOrigin =
  typeof window !== "undefined" ? window.location.origin.trim() : "";
const configuredAdminUrl = (import.meta.env.VITE_ADMIN_URL ?? "")
  .trim()
  .replace(/\/+$/, "");

const serverUrl =
  configuredServerUrl ||
  (import.meta.env.PROD
    ? runtimeOrigin || configuredAdminUrl || "http://localhost:3000"
    : "http://localhost:3000");

export const authClient = createAuthClient({
  baseURL: `${serverUrl}/api/auth`,
});
