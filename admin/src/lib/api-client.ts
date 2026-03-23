import { requestServerJson } from "@/lib/server-http";

type ApiRequestInit = Omit<RequestInit, "body"> & {
  body?: BodyInit | object | null;
};

const API_BASE = "/api/v1";

const toApiPath = (path: string) =>
  `${API_BASE}${path.startsWith("/") ? path : `/${path}`}`;

const normalizeBody = (body: ApiRequestInit["body"]) => {
  if (
    body == null ||
    typeof body === "string" ||
    body instanceof FormData ||
    body instanceof Blob ||
    body instanceof URLSearchParams ||
    body instanceof ArrayBuffer
  ) {
    return body ?? undefined;
  }

  return JSON.stringify(body);
};

const requestApi = <T>(path: string, init: ApiRequestInit = {}) => {
  const body = normalizeBody(init.body);
  const shouldSendJson =
    body !== undefined && typeof body === "string" && !(init.body instanceof FormData);

  return requestServerJson<T>(toApiPath(path), {
    ...init,
    body,
    headers: {
      ...(shouldSendJson ? { "content-type": "application/json" } : {}),
      ...(init.headers ?? {}),
    },
  });
};

export const api = {
  get<T = unknown>(path: string, init?: Omit<ApiRequestInit, "body" | "method">) {
    return requestApi<T>(path, {
      ...(init ?? {}),
      method: "GET",
    });
  },
  post<T = unknown>(
    path: string,
    body?: ApiRequestInit["body"],
    init?: Omit<ApiRequestInit, "body" | "method">,
  ) {
    return requestApi<T>(path, {
      ...(init ?? {}),
      method: "POST",
      body,
    });
  },
  put<T = unknown>(
    path: string,
    body?: ApiRequestInit["body"],
    init?: Omit<ApiRequestInit, "body" | "method">,
  ) {
    return requestApi<T>(path, {
      ...(init ?? {}),
      method: "PUT",
      body,
    });
  },
  delete<T = unknown>(path: string, init?: Omit<ApiRequestInit, "body" | "method">) {
    return requestApi<T>(path, {
      ...(init ?? {}),
      method: "DELETE",
    });
  },
};
