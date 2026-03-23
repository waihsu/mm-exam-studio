import { HTTPException } from "hono/http-exception";

export const toSupportHttpError = (
  error: unknown,
  fallbackMessage: string,
): never => {
  if (error instanceof HTTPException) {
    throw error;
  }

  const message =
    error instanceof Error && error.message.trim().length > 0
      ? error.message
      : fallbackMessage;
  const lower = message.toLowerCase();

  const status = lower.includes("not found")
    ? 404
    : lower.includes("too many") || lower.includes("rate limit")
      ? 429
      : lower.includes("turned off replies") ||
          lower.includes("already") ||
          lower.includes("closed")
        ? 409
        : 400;

  throw new HTTPException(status, { message });
};
