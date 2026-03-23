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
    throw new HTTPException(400, { message: parsed.error.message });
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
