import { API_BASE_URL, API_REQUEST_TIMEOUT_MS } from "./config";
import { clearAuthToken, getAuthToken } from "./auth-token-store";

type ApiRequestOptions = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  headers?: Record<string, string>;
  timeoutMs?: number;
  credentials?: RequestCredentials;
};

const toErrorMessage = (fallback: string, payload: unknown) => {
  if (
    payload &&
    typeof payload === "object" &&
    "message" in payload &&
    typeof (payload as { message?: unknown }).message === "string"
  ) {
    const message = (payload as { message: string }).message.trim();
    if (message.length > 0) return message;
  }
  return fallback;
};

const toReadableErrorMessage = (
  fallback: string,
  payload: unknown,
  statusCode?: number,
) => {
  if (payload && typeof payload === "object") {
    const asMessage = (payload as { message?: unknown }).message;
    if (typeof asMessage === "string" && asMessage.trim().length > 0) {
      return asMessage.trim();
    }

    const asError = (payload as { error?: unknown }).error;
    if (typeof asError === "string" && asError.trim().length > 0) {
      return asError.trim();
    }
  }

  if (statusCode === 401) return "Authentication required.";
  if (statusCode === 403) return "You do not have permission to perform this action.";
  if (statusCode === 404) return "Requested resource was not found.";
  if (statusCode === 408) return "Request timed out.";
  if (statusCode && statusCode >= 500) return "Server error. Please try again.";

  return fallback;
};

export class ApiClientError extends Error {
  readonly statusCode?: number;
  readonly method: string;
  readonly path: string;
  readonly payload?: unknown;

  constructor(params: {
    message: string;
    method: string;
    path: string;
    statusCode?: number;
    payload?: unknown;
  }) {
    super(params.message);
    this.name = "ApiClientError";
    this.statusCode = params.statusCode;
    this.method = params.method;
    this.path = params.path;
    this.payload = params.payload;
  }
}

export const apiRequest = async <T>(
  path: string,
  options: ApiRequestOptions = {},
): Promise<T> => {
  if (!path.startsWith("/")) {
    throw new Error(`apiRequest path must start with '/': ${path}`);
  }

  const method = options.method ?? "GET";
  const hasBody = options.body !== undefined;
  const token = await getAuthToken();
  const headers: Record<string, string> = {
    ...(hasBody ? { "content-type": "application/json" } : {}),
    ...(options.headers ?? {}),
  };

  if (!headers.authorization && token) {
    headers.authorization = `Bearer ${token}`;
  }

  const controller = new AbortController();
  const timeoutMs = Math.max(1_000, Math.trunc(options.timeoutMs ?? API_REQUEST_TIMEOUT_MS));
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      credentials: options.credentials ?? "include",
      headers,
      body: hasBody ? JSON.stringify(options.body) : undefined,
      signal: controller.signal,
    });
  } catch (error) {
    clearTimeout(timeoutId);

    if (error instanceof Error && error.name === "AbortError") {
      throw new ApiClientError({
        message: "Request timed out. Please retry.",
        method,
        path,
      });
    }

    throw new ApiClientError({
      message: "Unable to connect to server. Check your internet or API base URL.",
      method,
      path,
    });
  }
  clearTimeout(timeoutId);

  const contentType = response.headers.get("content-type")?.toLowerCase() ?? "";
  const payload = (await (async () => {
    if (contentType.includes("application/json")) {
      return (await response.json().catch(() => null)) as unknown;
    }
    const text = await response.text().catch(() => "");
    return text.trim().length > 0 ? text : null;
  })()) as unknown;

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      await clearAuthToken().catch(() => undefined);
    }

    throw new ApiClientError({
      message: toReadableErrorMessage(
        toErrorMessage("Request failed.", payload),
        payload,
        response.status,
      ),
      method,
      path,
      statusCode: response.status,
      payload,
    });
  }

  return payload as T;
};
