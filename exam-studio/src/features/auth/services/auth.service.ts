import * as Linking from "expo-linking";
import { ApiClientError, apiRequest } from "@/lib/api-client";
import { authClient } from "@/lib/auth-client";
import { getSignInDeviceContext } from "@/lib/sign-in-device-context";
import { clearAuthToken, setAuthToken } from "@/lib/auth-token-store";
import { clearAllCachedQuestionPaperPdfPreviews } from "@/features/papers/services/paper-pdf.service";
import { unregisterExpoPushRegistration } from "@/features/notifications/services/expo-push-registration.service";

type SignInEmailInput = {
  email: string;
  password: string;
};

type SignUpEmailInput = {
  name: string;
  email: string;
  password: string;
};

type VerifyTwoFactorInput = {
  method: "totp" | "backup";
  code: string;
  trustDevice?: boolean;
};

type ChangePasswordInput = {
  currentPassword: string;
  newPassword: string;
};

type RequestPasswordResetInput = {
  email: string;
};

type ResetPasswordInput = {
  token: string;
  newPassword: string;
};

type SendVerificationEmailInput = {
  email: string;
};

type AuthSignInResponse = {
  token?: string;
  requiresTwoFactor?: boolean;
  challengeType?: string;
  message?: string;
};

type SessionUser = {
  id: string;
  email?: string | null;
  emailVerified?: boolean | null;
  name?: string | null;
  role?: string | null;
};

type SessionData = {
  user: SessionUser;
  session: {
    id: string;
    expiresAt?: string | Date | null;
  };
};

export type AuthSessionDevice = {
  id: string;
  createdAt: string;
  expiresAt: string;
  device: string;
  bucket: "mobile" | "desktop";
  allowed: boolean;
};

export type AuthSessionListResponse = {
  currentSessionId: string;
  sessions: AuthSessionDevice[];
};

type AuthClientResponse = {
  data?: SessionData | null;
  error?: { message?: string; status?: number } | null;
};

export type SignInEmailResult =
  | {
      requiresTwoFactor: true;
      message: string;
      challengeType?: string;
    }
  | {
      requiresTwoFactor: false;
      session: SessionData;
    };

export type SignUpEmailResult = {
  email: string;
  verificationRequired: true;
};

export type RequestPasswordResetResult = {
  message: string;
};

export type SendVerificationEmailResult = {
  message: string;
};

const MOBILE_AUTH_ORIGIN = "examstudio://";

const authMutationOptions = () => ({
  credentials: "omit" as const,
  headers: {
    origin: MOBILE_AUTH_ORIGIN,
  },
});

const toErrorMessage = (error: unknown, fallback: string) =>
  error instanceof Error && error.message.trim().length > 0
    ? error.message
    : fallback;

const clearLocalSignedInState = async () => {
  await clearAllCachedQuestionPaperPdfPreviews().catch(() => undefined);
  await clearAuthToken();
};

export const getSession = async () => {
  const result = (await authClient.getSession()) as AuthClientResponse;

  if (result.error) {
    if (result.error.status === 401 || result.error.status === 403) {
      await clearAuthToken();
      return null;
    }
    throw new Error(result.error.message || "Failed to load session.");
  }

  return result.data ?? null;
};

export const signInWithEmail = (input: SignInEmailInput) =>
  (async (): Promise<SignInEmailResult> => {
    const deviceContext = await getSignInDeviceContext().catch(() => null);
    let payload: AuthSignInResponse;

    try {
      payload = await apiRequest<AuthSignInResponse>("/api/auth/sign-in/email", {
        method: "POST",
        ...authMutationOptions(),
        body: {
          ...input,
          callbackURL: Linking.createURL("/email-verified"),
          ...(deviceContext ?? {}),
        },
      });
    } catch (error) {
      if (
        error instanceof ApiClientError &&
        error.statusCode === 403 &&
        error.message.toLowerCase().includes("email") &&
        error.message.toLowerCase().includes("verified")
      ) {
        throw new Error(
          "Please verify your email first. Use the resend verification action if you need a new link.",
        );
      }
      throw error;
    }

    if (payload.requiresTwoFactor) {
      return {
        requiresTwoFactor: true,
        challengeType: payload.challengeType,
        message: payload.message || "Two-factor verification required.",
      };
    }

    if (typeof payload.token === "string" && payload.token.trim().length > 0) {
      await setAuthToken(payload.token);
    }

    let sessionData: SessionData | null = null;

    try {
      sessionData = await getSession();
    } catch (error) {
      throw new Error(toErrorMessage(error, "Signed in, but session was not loaded."));
    }

    if (!sessionData) {
      throw new Error("Signed in, but no active session was returned.");
    }

    return {
      requiresTwoFactor: false,
      session: sessionData,
    };
  })();

export const signUpWithEmail = async (
  input: SignUpEmailInput,
): Promise<SignUpEmailResult> => {
  const normalizedEmail = input.email.trim().toLowerCase();

  const payload = await apiRequest<AuthSignInResponse>("/api/auth/sign-up/email", {
    method: "POST",
    ...authMutationOptions(),
    body: {
      name: input.name.trim(),
      email: normalizedEmail,
      password: input.password,
      callbackURL: Linking.createURL("/email-verified"),
    },
  });

  if (typeof payload.token === "string" && payload.token.trim().length > 0) {
    await clearAuthToken().catch(() => undefined);
  }

  return {
    email: normalizedEmail,
    verificationRequired: true,
  };
};

export const signOut = async () => {
  let remoteSignOutError: unknown = null;

  await unregisterExpoPushRegistration().catch(() => undefined);

  try {
    await apiRequest("/api/auth/sign-out", {
      method: "POST",
      ...authMutationOptions(),
      body: {},
    });
  } catch (error) {
    if (
      !(error instanceof ApiClientError) ||
      (error.statusCode !== 401 && error.statusCode !== 403)
    ) {
      remoteSignOutError = error;
    }
  }

  try {
    await authClient.signOut();
  } catch {
    // Ignore fallback client sign-out failures after the API attempt.
  }

  await clearLocalSignedInState();

  if (remoteSignOutError) {
    throw new Error(
      toErrorMessage(
        remoteSignOutError,
        "Signed out on this device, but the server session could not be closed.",
      ),
    );
  }
};

export const requestPasswordReset = async (
  input: RequestPasswordResetInput,
): Promise<RequestPasswordResetResult> => {
  const email = input.email.trim().toLowerCase();
  const redirectTo = Linking.createURL("/reset-password");

  const payload = await apiRequest<{ message?: string }>("/api/auth/request-password-reset", {
    method: "POST",
    ...authMutationOptions(),
    body: {
      email,
      redirectTo,
    },
  });

  return {
    message:
      typeof payload.message === "string" && payload.message.trim().length > 0
        ? payload.message.trim()
        : "If this email exists, a reset link has been sent.",
  };
};

export const resetPassword = async (input: ResetPasswordInput) => {
  await apiRequest<{ status?: boolean }>("/api/auth/reset-password", {
    method: "POST",
    ...authMutationOptions(),
    body: {
      token: input.token.trim(),
      newPassword: input.newPassword,
    },
  });

  return {
    success: true,
  };
};

export const sendVerificationEmail = async (
  input: SendVerificationEmailInput,
): Promise<SendVerificationEmailResult> => {
  await apiRequest<{ status?: boolean }>("/api/auth/send-verification-email", {
    method: "POST",
    ...authMutationOptions(),
    body: {
      email: input.email.trim().toLowerCase(),
      callbackURL: Linking.createURL("/email-verified"),
    },
  });

  return {
    message: "Verification email sent. Check your inbox.",
  };
};

export const verifyTwoFactor = async (input: VerifyTwoFactorInput) => {
  const endpoint =
    input.method === "backup"
      ? "/api/auth/two-factor/verify-backup-code"
      : "/api/auth/two-factor/verify-totp";

  const payload = await apiRequest<{ token?: string }>(endpoint, {
    method: "POST",
    ...authMutationOptions(),
    body: {
      code: input.code.trim(),
      trustDevice: input.trustDevice ?? false,
    },
  });

  if (typeof payload.token === "string" && payload.token.trim().length > 0) {
    await setAuthToken(payload.token);
  }

  const sessionData = await getSession();
  if (!sessionData) {
    throw new Error("Verification succeeded, but session was not loaded.");
  }

  return {
    session: sessionData,
  };
};

const toLocalSessionLabel = async () => {
  const deviceContext = await getSignInDeviceContext().catch(() => null);
  if (!deviceContext) {
    return null;
  }

  const platform = deviceContext.devicePlatform;
  const label =
    deviceContext.deviceLabel?.trim() ||
    deviceContext.deviceModel?.trim() ||
    (platform === "android"
      ? "Android phone"
      : platform === "ios"
        ? "iPhone"
        : null);

  if (!label) {
    return null;
  }

  return {
    device: label,
    bucket:
      platform === "android" || platform === "ios"
        ? ("mobile" as const)
        : ("desktop" as const),
  };
};

export const listOwnSessions = async () => {
  const payload = await apiRequest<AuthSessionListResponse>("/api/auth/sessions");
  const localSessionLabel = await toLocalSessionLabel();

  if (!localSessionLabel) {
    return payload;
  }

  return {
    ...payload,
    sessions: payload.sessions.map((session) =>
      session.id === payload.currentSessionId
        ? {
            ...session,
            device: localSessionLabel.device,
            bucket: localSessionLabel.bucket,
          }
        : session,
    ),
  };
};

export const revokeOtherSessions = () =>
  apiRequest<{ revokedCount: number }>("/api/auth/sessions/revoke-others", {
    method: "POST",
    body: {},
  });

export const revokeSession = (sessionId: string) =>
  apiRequest<{ revoked: boolean; sessionId: string }>("/api/auth/sessions/revoke", {
    method: "POST",
    body: { sessionId },
  });

export const changePassword = (input: ChangePasswordInput) =>
  apiRequest<{ success: boolean; revokedCount: number }>("/api/auth/password/change", {
    method: "POST",
    body: input,
  });
