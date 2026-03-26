type ServerJsonSuccess<T> = {
  ok: true;
  status: number;
  data: T;
};

type ServerJsonFailure<T> = {
  ok: false;
  status: number;
  message: string;
  data: T | null;
};

export type ServerJsonResult<T> = ServerJsonSuccess<T> | ServerJsonFailure<T>;

const configuredServerUrl = (import.meta.env.VITE_SERVER_URL ?? "")
  .trim()
  .replace(/\/+$/, "");

const serverUrl =
  configuredServerUrl ||
  (import.meta.env.PROD
    ? (
        import.meta.env.VITE_APP_URL ??
        (typeof window !== "undefined"
          ? window.location.origin
          : "http://localhost:3000")
      )
        .trim()
        .replace(/\/+$/, "")
    : "http://localhost:3000");

const isAbsoluteUrl = (value: string) => /^https?:\/\//i.test(value);

export const toServerUrl = (value: string) => {
  if (isAbsoluteUrl(value)) return value;
  return `${serverUrl}${value.startsWith("/") ? value : `/${value}`}`;
};

const resolveErrorMessage = (payload: unknown, status: number) => {
  if (payload && typeof payload === "object") {
    const candidate = payload as {
      message?: unknown;
      error?: { message?: unknown } | unknown;
    };

    if (typeof candidate.message === "string" && candidate.message.trim()) {
      return candidate.message;
    }

    if (
      candidate.error &&
      typeof candidate.error === "object" &&
      "message" in candidate.error &&
      typeof candidate.error.message === "string" &&
      candidate.error.message.trim()
    ) {
      return candidate.error.message;
    }
  }

  if (status === 401) return "Unauthorized";
  if (status === 403) return "Forbidden";
  if (status === 404) return "Not found";
  return "Request failed";
};

export async function requestServerJson<T>(
  input: string,
  init: RequestInit = {},
): Promise<ServerJsonResult<T>> {
  try {
    const token = getAuthToken();
    const response = await fetch(toServerUrl(input), {
      credentials: "omit",
      ...init,
      headers: {
        accept: "application/json",
        ...(token ? { authorization: `Bearer ${token}` } : {}),
        ...(init.headers ?? {}),
      },
    });

    const contentType = response.headers.get("content-type") ?? "";
    const data = contentType.includes("application/json")
      ? ((await response.json().catch(() => null)) as T | null)
      : null;

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        clearAuthToken();
      }
      return {
        ok: false,
        status: response.status,
        message: resolveErrorMessage(data, response.status),
        data,
      };
    }

    return {
      ok: true,
      status: response.status,
      data: (data ?? ({} as T)) as T,
    };
  } catch (error) {
    return {
      ok: false,
      status: 0,
      message:
        error instanceof Error ? error.message : "Network request failed",
      data: null,
    };
  }
}
import {
  clearAuthToken,
  getAuthToken,
} from "@/features/auth/utils/auth-token-store";
