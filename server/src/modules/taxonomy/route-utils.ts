import { HTTPException } from "hono/http-exception";
export {
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

  const normalizedMessage = message.toLowerCase();
  const status = normalizedMessage.includes("not found")
    ? 404
    : normalizedMessage.includes("already exists") ||
        normalizedMessage.includes("duplicate")
      ? 409
      : 400;

  throw new HTTPException(status, { message });
};

