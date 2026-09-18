const EXPIRING_SOON_MS = 24 * 60 * 60 * 1000;

export const normalizeDeviceText = (value: string | null | undefined) =>
  (value ?? "").replace(/\s+/g, " ").trim();

const detectPlatform = (input: string) => {
  if (!input) return "";
  const value = input.toLowerCase();
  if (value.includes("android")) return "Android";
  if (value.includes("iphone") || value.includes("ipad") || value.includes("ios")) return "iOS";
  if (value.includes("windows")) return "Windows";
  if (value.includes("mac os") || value.includes("macintosh")) return "macOS";
  if (value.includes("linux")) return "Linux";
  return "";
};

const detectBrowser = (input: string) => {
  if (!input) return "";
  const value = input.toLowerCase();
  if (value.includes("edg/")) return "Edge";
  if (value.includes("chrome/") && !value.includes("edg/")) return "Chrome";
  if (value.includes("firefox/")) return "Firefox";
  if (value.includes("safari/") && !value.includes("chrome/")) return "Safari";
  if (value.includes("opera/") || value.includes("opr/")) return "Opera";
  return "";
};

export const formatDeviceLabel = (rawDevice: string | null | undefined, bucket?: string) => {
  const normalized = normalizeDeviceText(rawDevice);
  if (!normalized) return bucket === "mobile" ? "Mobile device" : "Desktop device";

  const platform = detectPlatform(normalized);
  const browser = detectBrowser(normalized);
  const looksLikeUserAgent = normalized.includes("/") || normalized.includes("mozilla");
  const labelParts = [platform, browser].filter(Boolean);

  if (labelParts.length > 0) return labelParts.join(" · ");
  if (looksLikeUserAgent && bucket === "mobile") return "Mobile browser";
  if (looksLikeUserAgent) return "Desktop browser";
  return normalized;
};

export const isExpiringSoon = (expiresAt: string | null | undefined, now = Date.now()) => {
  if (!expiresAt) return false;
  const expiresAtMs = new Date(expiresAt).getTime();
  if (Number.isNaN(expiresAtMs)) return false;
  const remainingMs = expiresAtMs - now;
  return remainingMs > 0 && remainingMs <= EXPIRING_SOON_MS;
};

export const toLocaleDateTime = (value: string | null | undefined) => {
  if (!value) return "Unknown";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString("en-US");
};
