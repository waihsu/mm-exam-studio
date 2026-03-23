import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { defineConfig } from "drizzle-kit";

const serverDir = resolve(process.cwd(), "server");
const envPath = resolve(serverDir, ".env");

if (!process.env.DATABASE_URL && existsSync(envPath)) {
  const content = readFileSync(envPath, "utf8");
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const separatorIndex = line.indexOf("=");
    if (separatorIndex === -1) continue;
    const key = line.slice(0, separatorIndex).trim();
    let value = line.slice(separatorIndex + 1).trim();
    if (!key || process.env[key]) continue;
    if (
      (value.startsWith("\"") && value.endsWith("\"")) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    process.env[key] = value;
  }
}

export default defineConfig({
  out: "./server/drizzle",
  schema: "./server/src/db/*-schema.ts",
  dialect: "postgresql",
  migrations: {
    table: "__drizzle_migrations",
    schema: "public",
  },
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
