#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

const mode = process.argv[2] === "production" ? "production" : "development";

const readDotEnvValue = (key) => {
  const candidates =
    mode === "production"
      ? [".env.production.local", ".env.local", ".env.production", ".env"]
      : [".env.local", ".env"];

  for (const candidate of candidates) {
    const fullPath = path.resolve(process.cwd(), candidate);
    if (!fs.existsSync(fullPath)) {
      continue;
    }

    const content = fs.readFileSync(fullPath, "utf8");
    const lines = content.split(/\r?\n/);
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;

      const [left, ...rightParts] = trimmed.split("=");
      if (left?.trim() !== key) continue;
      return rightParts.join("=").trim().replace(/^["']|["']$/g, "");
    }
  }

  return "";
};

const rawBaseUrl = String(
  process.env.EXPO_PUBLIC_API_BASE_URL || readDotEnvValue("EXPO_PUBLIC_API_BASE_URL") || "",
).trim();

if (!rawBaseUrl) {
  console.error("Missing EXPO_PUBLIC_API_BASE_URL.");
  process.exit(1);
}

let parsed;
try {
  parsed = new URL(rawBaseUrl);
} catch {
  console.error("EXPO_PUBLIC_API_BASE_URL is not a valid URL.");
  process.exit(1);
}

const hostname = parsed.hostname.trim().toLowerCase();
const isLocalHost =
  hostname === "localhost" ||
  hostname === "127.0.0.1" ||
  hostname === "10.0.2.2" ||
  hostname.endsWith(".local");
const isPrivateIpv4 =
  /^10\./.test(hostname) ||
  /^192\.168\./.test(hostname) ||
  /^172\.(1[6-9]|2\d|3[01])\./.test(hostname);

if (mode === "production") {
  if (parsed.protocol !== "https:") {
    console.error("Production EXPO_PUBLIC_API_BASE_URL must use https.");
    process.exit(1);
  }
  if (isLocalHost || isPrivateIpv4) {
    console.error("Production EXPO_PUBLIC_API_BASE_URL must be publicly reachable.");
    process.exit(1);
  }
}

console.log(
  `Environment validation passed (${mode}) for EXPO_PUBLIC_API_BASE_URL=${parsed.origin}`,
);
