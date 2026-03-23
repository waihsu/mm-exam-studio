import type {
  AuthUser,
  AuthSession,
  AuthSessionsOverview,
  ForgotPasswordInput,
  ResetPasswordInput,
  SignInInput,
  SignInResult,
  UserRole,
  VerifyTwoFactorInput,
} from "../types";
import { requestServerJson } from "@/lib/server-http";

const appUrl = (() => {
  const runtimeOrigin =
    typeof window !== "undefined" ? window.location.origin.trim() : "";
  const configuredAdminUrl = (import.meta.env.VITE_ADMIN_URL ?? "")
    .trim()
    .replace(/\/+$/, "");

  return (runtimeOrigin || configuredAdminUrl || "http://localhost:5174")
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

type FetchMeResult =
  | {
      ok: false;
      message: string;
    }
  | {
      ok: true;
      user: MePayload["user"];
      session: MePayload["session"];
      roles: UserRole[];
    };

const ME_CACHE_TTL_MS = 30_000;
let meCache: { expiresAt: number; value: FetchMeResult } | null = null;
let meInFlight: Promise<FetchMeResult> | null = null;

const clearMeCache = () => {
  meCache = null;
  meInFlight = null;
};

const sleep = (ms: number) =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

const shouldRetryAuthSignIn = (status: number, message: string) =>
  status === 503 &&
  /1102|service unavailable|worker exceeded cpu time limit/i.test(message);

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

let authClientPromise: Promise<
  (typeof import("@/lib/auth-client"))["authClient"]
> | null = null;

const loadAuthClient = async () => {
  authClientPromise ??= import("@/lib/auth-client").then(
    (module) => module.authClient,
  );
  return authClientPromise;
};

export const authApi = {
  async signIn(input: SignInInput): Promise<SignInResult> {
    const payload = {
      email: input.email.trim().toLowerCase(),
      password: input.password,
    };

    let response = await requestServerJson<{
      token?: string;
      user?: { id?: string };
    }>("/api/auth/sign-in/email", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (
      !response.ok &&
      shouldRetryAuthSignIn(response.status, response.message)
    ) {
      await sleep(250);
      response = await requestServerJson<{
        token?: string;
        user?: { id?: string };
      }>("/api/auth/sign-in/email", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
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
      clearMeCache();
      return { ok: true };
    }

    return { ok: false, message: response.message };
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
        headers: { "content-type": "application/json" },
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
    clearMeCache();
    return { ok: true as const };
  },
  async enableTwoFactor(input: { password: string; issuer?: string }) {
    const response = await requestServerJson<{ totpURI: string; backupCodes: string[] }>(
      "/api/auth/two-factor/enable",
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          password: input.password,
          issuer: input.issuer,
        }),
      },
    );
    if (!response.ok) {
      return {
        ok: false as const,
        message: response.message || "Failed to enable two-factor authentication",
      };
    }
    return {
      ok: true as const,
      totpURI: response.data.totpURI,
      backupCodes: response.data.backupCodes,
    };
  },
  async disableTwoFactor(input: { password: string }) {
    const response = await requestServerJson<{ status: boolean }>(
      "/api/auth/two-factor/disable",
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          password: input.password,
        }),
      },
    );
    if (!response.ok) {
      return {
        ok: false as const,
        message: response.message || "Failed to disable two-factor authentication",
      };
    }
    clearMeCache();
    return { ok: true as const };
  },
  async regenerateBackupCodes(input: { password: string }) {
    const response = await requestServerJson<{ status: boolean; backupCodes: string[] }>(
      "/api/auth/two-factor/generate-backup-codes",
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          password: input.password,
        }),
      },
    );
    if (!response.ok) {
      return {
        ok: false as const,
        message: response.message || "Failed to generate backup codes",
      };
    }
    return {
      ok: true as const,
      backupCodes: response.data.backupCodes,
    };
  },
  async signInWithGoogle(callbackURL = "/") {
    const authClient = await loadAuthClient();
    return authClient.signIn.social({
      provider: "google",
      callbackURL: toAbsoluteCallbackURL(callbackURL),
      disableRedirect: true,
    });
  },
  async signOut() {
    const authClient = await loadAuthClient();
    const response = await authClient.signOut();
    if (!response.error) {
      clearMeCache();
    }
    return response;
  },
  async requestPasswordReset(input: ForgotPasswordInput) {
    const email = input.email.trim().toLowerCase();
    const redirectTo =
      typeof input.redirectTo === "string" && input.redirectTo.trim().length > 0
        ? input.redirectTo.trim()
        : "/reset-password";
    const response = await requestServerJson<{
      status?: boolean;
      message?: string;
    }>("/api/auth/request-password-reset", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        email,
        redirectTo: toAbsoluteCallbackURL(redirectTo),
      }),
    });
    if (!response.ok) {
      return {
        ok: false as const,
        status: response.status,
        message: response.message ?? "Failed to request password reset",
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
  async resetPassword(input: ResetPasswordInput) {
    const response = await requestServerJson<{ status?: boolean }>(
      "/api/auth/reset-password",
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          token: input.token.trim(),
          newPassword: input.newPassword,
        }),
      },
    );
    if (!response.ok) {
      return {
        ok: false as const,
        status: response.status,
        message: response.message ?? "Failed to reset password",
      };
    }
    return { ok: true as const };
  },
  clearMeCache,
  async revokeOtherSessions() {
    const response = await requestServerJson<{ revokedCount?: number }>(
      "/api/auth/sessions/revoke-others",
      { method: "POST" },
    );
    if (!response.ok) {
      return {
        ok: false as const,
        message: "Failed to revoke other sessions",
      };
    }

    return {
      ok: true as const,
      revokedCount: Number(response.data.revokedCount ?? 0),
    };
  },
  async listSessions() {
    return requestServerJson<AuthSessionsOverview>("/api/auth/sessions");
  },
  async revokeSession(sessionId: string) {
    return requestServerJson<{ revoked: boolean; sessionId: string }>(
      "/api/auth/sessions/revoke",
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({ sessionId }),
      },
    );
  },
  async fetchMe() {
    const now = Date.now();
    if (meCache && meCache.expiresAt > now) {
      return meCache.value;
    }
    if (meInFlight) {
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
            message: "Failed to load profile",
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
  async fetchProtectedUser() {
    const response = await requestServerJson<{
      user?: { email?: string | null };
    }>("/api/v1/me");
    if (!response.ok) {
      return {
        ok: false as const,
        message: "Protected API failed: unauthorized",
      };
    }

    const email =
      typeof response.data?.user?.email === "string"
        ? response.data.user.email
        : "unknown";
    return {
      ok: true as const,
      message: `Protected API success: ${email}`,
    };
  },
};
