import { HTTPException } from "hono/http-exception";
export {
  assertContentLengthWithin,
  parseJsonBodyWithSchema,
  readPositiveNumberParam,
} from "@/lib/route-utils";

export const toHttpError = (error: unknown, fallbackMessage: string): never => {
  if (error instanceof HTTPException) {
    throw error;
  }

  const message =
    error instanceof Error && error.message.trim().length > 0
      ? error.message
      : fallbackMessage;

  const normalized = message.toLowerCase();
  const status = normalized.includes("not found")
    ? 404
    : normalized.includes("rate limit") ||
        normalized.includes("too many") ||
        normalized.includes("limit reached")
      ? 429
      : normalized.includes("not available in the cloudflare worker runtime")
        ? 501
        : normalized.includes("already") || normalized.includes("unavailable")
          ? 409
          : 400;

  throw new HTTPException(status, { message });
};
