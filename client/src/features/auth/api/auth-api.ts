import { requestServerJson } from "@/lib/server-http";
import {
  clearAuthToken,
  setAuthToken,
} from "../utils/auth-token-store";
import type {
  AuthSessionsOverview,
  AuthSession,
  AuthUser,
  SignInInput,
  SignInResult,
  SignUpInput,
  UserRole,
  VerifyTwoFactorInput,
} from "../types";

const appUrl = (() => {
  const runtimeOrigin =
    typeof window !== "undefined" ? window.location.origin.trim() : "";
  const configuredClientUrl = (import.meta.env.VITE_CLIENT_URL ?? "")
    .trim()
    .replace(/\/+$/, "");

  return (runtimeOrigin || configuredClientUrl || "http://localhost:5173")
    .trim()
    .replace(/\/+$/, "");
})();

const toAbsoluteCallbackURL = (callbackURL: string) => {
  if (/^https?:\/\//i.test(callbackURL)) {
    return callbackURL;
  }

  const normalized = callbackURL.startsWith("/")
    ? callbackURL
    : `/${callbackURL}`;
  return `${appUrl}${normalized}`;
};

type MePayload = {
  user?: AuthUser | null;
  session?: AuthSession | null;
  roles?: string[] | null;
};

export type FetchMeResult =
  | {
      ok: false;
      message: string;
    }
  | {
      ok: true;
      user: AuthUser | null;
      session: AuthSession | null;
      roles: UserRole[];
    };

const ME_CACHE_TTL_MS = 30_000;

let meCache: { expiresAt: number; value: FetchMeResult } | null = null;
let meInFlight: Promise<FetchMeResult> | null = null;

const sleep = (ms: number) =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

const shouldRetryAuthSignIn = (result: {
  ok: boolean;
  status: number;
  message?: string;
}) =>
  !result.ok &&
  result.status === 503 &&
  /1102|service unavailable|worker exceeded cpu time limit/i.test(
    result.message ?? "",
  );

const normalizeRoles = (roles: unknown): UserRole[] => {
  if (!Array.isArray(roles)) return [];

  const accepted = new Set<UserRole>();
  for (const role of roles) {
    if (
      role === "student" ||
      role === "instructor" ||
      role === "admin" ||
      role === "superadmin"
    ) {
      accepted.add(role);
    }
  }

  return [...accepted];
};

export const authApi = {
  clearMeCache() {
    meCache = null;
    meInFlight = null;
  },
  async fetchMe(force = false): Promise<FetchMeResult> {
    const now = Date.now();

    if (!force && meCache && meCache.expiresAt > now) {
      return meCache.value;
    }

    if (!force && meInFlight) {
      return meInFlight;
    }

    meInFlight = (async () => {
      const response = await requestServerJson<MePayload>("/api/v1/me");
      const result: FetchMeResult = response.ok
        ? {
            ok: true,
            user: response.data.user ?? null,
            session: response.data.session ?? null,
            roles: normalizeRoles(response.data.roles),
          }
        : {
            ok: false,
            message: response.message,
          };

      meCache = {
        expiresAt: Date.now() + ME_CACHE_TTL_MS,
        value: result,
      };

      return result;
    })();

    try {
      return await meInFlight;
    } finally {
      meInFlight = null;
    }
  },
  async signIn(input: SignInInput): Promise<SignInResult> {
    let response = await requestServerJson<{
      token?: string;
      user?: { id?: string };
    }>("/api/auth/sign-in/email", {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        email: input.email.trim().toLowerCase(),
        password: input.password,
      }),
    });

    if (shouldRetryAuthSignIn(response)) {
      await sleep(250);
      response = await requestServerJson<{
        token?: string;
        user?: { id?: string };
      }>("/api/auth/sign-in/email", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          email: input.email.trim().toLowerCase(),
          password: input.password,
        }),
      });
    }

    if (response.ok) {
      if ((response.data as { requiresTwoFactor?: unknown }).requiresTwoFactor === true) {
        return {
          ok: false,
          requiresTwoFactor: true,
          challengeType: "totp_or_backup",
          message:
            typeof (response.data as { message?: unknown }).message === "string"
              ? ((response.data as { message?: string }).message as string)
              : "Two-factor verification required.",
        };
      }

      if (typeof response.data.token === "string" && response.data.token.trim()) {
        setAuthToken(response.data.token);
      }
      authApi.clearMeCache();
      return { ok: true as const };
    }

    return {
      ok: false as const,
      message: response.message,
    };
  },
  async verifyTwoFactor(input: VerifyTwoFactorInput) {
    const endpoint =
      input.method === "backup"
        ? "/api/auth/two-factor/verify-backup-code"
        : "/api/auth/two-factor/verify-totp";
    const response = await requestServerJson<{ token?: string; user?: { id?: string } }>(
      endpoint,
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          code: input.code.trim(),
          trustDevice: input.trustDevice ?? false,
        }),
      },
    );
    if (!response.ok) {
      return {
        ok: false as const,
        message: response.message || "Two-factor verification failed",
      };
    }
    if (typeof response.data.token === "string" && response.data.token.trim()) {
      setAuthToken(response.data.token);
    }
    authApi.clearMeCache();
    return { ok: true as const };
  },
  async signUp(input: SignUpInput) {
    const response = await requestServerJson<{
      token?: string;
      user?: { id?: string };
    }>("/api/auth/sign-up/email", {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        name: input.name.trim(),
        email: input.email.trim().toLowerCase(),
        password: input.password,
      }),
    });

    if (!response.ok) {
      return {
        ok: false as const,
        message: response.message,
      };
    }

    clearAuthToken();
    authApi.clearMeCache();
    return { ok: true as const };
  },
  async signOut() {
    const response = await requestServerJson("/api/auth/sign-out", {
      method: "POST",
    });

    clearAuthToken();

    if (!response.ok) {
      return {
        ok: false as const,
        message: response.message,
      };
    }

    authApi.clearMeCache();
    return { ok: true as const };
  },
  async requestPasswordReset(input: { email: string; redirectTo?: string }) {
    const email = input.email.trim().toLowerCase();
    const redirectTo =
      typeof input.redirectTo === "string" && input.redirectTo.trim().length > 0
        ? input.redirectTo.trim()
        : "/signin";

    const response = await requestServerJson<{ message?: string }>(
      "/api/auth/request-password-reset",
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          email,
          redirectTo: toAbsoluteCallbackURL(redirectTo),
        }),
      },
    );

    if (!response.ok) {
      return {
        ok: false as const,
        message: response.message || "Failed to send reset link",
      };
    }

    return {
      ok: true as const,
      message:
        typeof response.data.message === "string"
          ? response.data.message
          : "If this email exists, a reset link has been sent.",
    };
  },
  async resetPassword(input: { token: string; newPassword: string }) {
    const response = await requestServerJson<{ status?: boolean }>(
      "/api/auth/reset-password",
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          token: input.token.trim(),
          newPassword: input.newPassword,
        }),
      },
    );

    if (!response.ok) {
      return {
        ok: false as const,
        message: response.message || "Unable to reset your password.",
      };
    }

    clearAuthToken();
    authApi.clearMeCache();
    return { ok: true as const };
  },
  async listSessions() {
    return requestServerJson<AuthSessionsOverview>("/api/auth/sessions");
  },
  async revokeOtherSessions() {
    return requestServerJson<{ revokedCount: number }>("/api/auth/sessions/revoke-others", {
      method: "POST",
    });
  },
  async revokeSession(sessionId: string) {
    return requestServerJson<{ revoked: boolean; sessionId: string }>("/api/auth/sessions/revoke", {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({ sessionId }),
    });
  },
};
