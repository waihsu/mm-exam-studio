const FALLBACK_API_BASE_URL = "http://10.0.2.2:3000";

const normalizeBaseUrl = (value: string | undefined) => {
  const trimmed = value?.trim();
  if (!trimmed) return FALLBACK_API_BASE_URL;
  return trimmed.replace(/\/+$/, "");
};

const isLocalHost = (hostname: string) =>
  hostname === "localhost" ||
  hostname === "127.0.0.1" ||
  hostname === "10.0.2.2" ||
  hostname.endsWith(".local");

const isPrivateIpv4 = (hostname: string) =>
  /^10\./.test(hostname) || /^192\.168\./.test(hostname) || /^172\.(1[6-9]|2\d|3[01])\./.test(hostname);

const validateApiBaseUrl = (value: string) => {
  try {
    const parsed = new URL(value);
    const hostname = parsed.hostname.trim().toLowerCase();

    if (__DEV__) {
      return parsed.toString().replace(/\/+$/, "");
    }

    if (parsed.protocol !== "https:") {
      throw new Error("EXPO_PUBLIC_API_BASE_URL must use https in production.");
    }

    if (isLocalHost(hostname) || isPrivateIpv4(hostname)) {
      throw new Error("EXPO_PUBLIC_API_BASE_URL must not use local/private host in production.");
    }

    return parsed.toString().replace(/\/+$/, "");
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Invalid EXPO_PUBLIC_API_BASE_URL.");
  }
};

export const API_BASE_URL = validateApiBaseUrl(
  normalizeBaseUrl(process.env.EXPO_PUBLIC_API_BASE_URL),
);

export const API_REQUEST_TIMEOUT_MS = 15_000;
