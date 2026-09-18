import { isCloudflareWorkerRuntime } from "./runtime";

const toOptionalFlag = (value: string | undefined) => {
  if (value == null) return null;

  const normalized = value.trim().toLowerCase();
  if (!normalized) return null;

  return !["0", "false", "no", "off"].includes(normalized);
};

const isProduction = () =>
  (process.env.NODE_ENV ?? "development").trim().toLowerCase() === "production";

const shouldTrustProxyIpHeaders = () => {
  const configured = toOptionalFlag(process.env.TRUST_PROXY_IP_HEADERS);
  if (configured != null) {
    return configured;
  }

  // Local development commonly runs behind a trusted reverse proxy or emulator,
  // but production should not trust proxy headers unless that trust is explicit.
  return !isProduction();
};

const normalizeIp = (value: string | null | undefined) => {
  const trimmed = value?.trim();
  if (!trimmed) return null;

  const bracketedIpv6 = trimmed.match(/^\[([a-f0-9:]+)\](?::\d+)?$/i);
  if (bracketedIpv6?.[1]) {
    return bracketedIpv6[1].toLowerCase();
  }

  const ipv4WithPort = trimmed.match(/^(\d{1,3}(?:\.\d{1,3}){3})(?::\d+)?$/);
  if (ipv4WithPort?.[1]) {
    return ipv4WithPort[1];
  }

  if (/^[a-f0-9:.]+$/i.test(trimmed)) {
    return trimmed.toLowerCase();
  }

  return null;
};

const readForwardedForIp = (request: Request) => {
  const forwarded = request.headers.get("x-forwarded-for");
  if (!forwarded) return null;

  for (const candidate of forwarded.split(",")) {
    const ip = normalizeIp(candidate);
    if (ip) {
      return ip;
    }
  }

  return null;
};

export const getRequestClientIp = (request: Request) => {
  const trustedCfIp = normalizeIp(request.headers.get("cf-connecting-ip"));
  if (trustedCfIp && isCloudflareWorkerRuntime()) {
    return trustedCfIp;
  }

  if (!shouldTrustProxyIpHeaders()) {
    return null;
  }

  return (
    trustedCfIp ??
    normalizeIp(request.headers.get("x-real-ip")) ??
    readForwardedForIp(request)
  );
};

export const getRequestClientIpKey = (request: Request) =>
  getRequestClientIp(request) ?? "unknown";
