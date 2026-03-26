import { HTTPException } from "hono/http-exception";
import type { z } from "zod";

export const readPositiveNumberParam = (value: string | undefined, fallback: number) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 1) {
    return fallback;
  }

  return Math.trunc(parsed);
};

export const parseJsonBodyWithSchema = async <T>(
  request: Request,
  schema: z.ZodType<T>,
) => {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    throw new HTTPException(400, { message: "Invalid JSON request body." });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0];
    const path =
      firstIssue?.path && firstIssue.path.length > 0
        ? firstIssue.path.map((part) => String(part)).join(".")
        : "body";
    const message = firstIssue
      ? `${path}: ${firstIssue.message}`
      : "Invalid request body.";
    throw new HTTPException(400, { message });
  }

  return parsed.data;
};

export const assertContentLengthWithin = (
  request: Request,
  maxBytes: number,
  fallbackMessage: string,
) => {
  const raw = request.headers.get("content-length");
  if (!raw) return;

  const contentLength = Number(raw);
  if (!Number.isFinite(contentLength)) return;
  if (contentLength > maxBytes) {
    throw new HTTPException(413, { message: fallbackMessage });
  }
};
