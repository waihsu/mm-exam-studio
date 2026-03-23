import { HTTPException } from "hono/http-exception";
export { readPositiveNumberParam } from "@/lib/route-utils";

export const toHttpError = (error: unknown, fallbackMessage: string): never => {
  if (error instanceof HTTPException) {
    throw error;
  }

  const message =
    error instanceof Error && error.message.trim().length > 0
      ? error.message
      : fallbackMessage;

  const normalizedMessage = message.toLowerCase();
  const status =
    normalizedMessage.includes("connection failed") ||
    (normalizedMessage.includes("database") && normalizedMessage.includes("failed"))
      ? 503
      : normalizedMessage.includes("not found")
        ? 404
        : normalizedMessage.includes("already exists") ||
            normalizedMessage.includes("duplicate") ||
            normalizedMessage.includes("unique")
          ? 409
          : normalizedMessage.includes("linked to related records") ||
              normalizedMessage.includes("foreign key") ||
              normalizedMessage.includes("constraint")
            ? 409
            : 400;

  throw new HTTPException(status, { message });
};

export const readBooleanParam = (value: string | undefined) => {
  if (value === "true") return true;
  if (value === "false") return false;
  return undefined;
};

