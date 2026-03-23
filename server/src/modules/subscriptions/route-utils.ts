import { HTTPException } from "hono/http-exception";

export const toSubscriptionHttpError = (
  error: unknown,
  fallbackMessage: string,
  options: {
    notFoundKeywords?: string[];
    conflictKeywords?: string[];
  } = {},
): never => {
  if (error instanceof HTTPException) {
    throw error;
  }

  const message =
    error instanceof Error && error.message.trim().length > 0
      ? error.message
      : fallbackMessage;
  const lower = message.toLowerCase();
  const notFoundKeywords = options.notFoundKeywords ?? ["not found"];
  const conflictKeywords = options.conflictKeywords ?? ["already", "duplicate"];

  const status = notFoundKeywords.some((keyword) => lower.includes(keyword))
    ? 404
    : conflictKeywords.some((keyword) => lower.includes(keyword))
      ? 409
      : 400;

  throw new HTTPException(status, { message });
};

