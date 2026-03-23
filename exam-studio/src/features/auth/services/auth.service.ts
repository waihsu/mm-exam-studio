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
  bucket: string;
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
  session: SessionData;
};

export type RequestPasswordResetResult = {
  message: string;
};

export type SendVerificationEmailResult = {
  message: string;
};

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
    const payload = await apiRequest<AuthSignInResponse>("/api/auth/sign-in/email", {
      method: "POST",
      body: {
        ...input,
        ...(deviceContext ?? {}),
      },
    });

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
    body: {
      name: input.name.trim(),
      email: normalizedEmail,
      password: input.password,
    },
  });

  if (typeof payload.token === "string" && payload.token.trim().length > 0) {
    await setAuthToken(payload.token);
  }

  let sessionData: SessionData | null = null;

  try {
    sessionData = await getSession();
  } catch {
    sessionData = null;
  }

  if (!sessionData) {
    const signInResult = await signInWithEmail({
      email: normalizedEmail,
      password: input.password,
    });

    if (signInResult.requiresTwoFactor) {
      throw new Error("Account created, but two-factor verification is required before continuing.");
    }

    sessionData = signInResult.session;
  }

  return {
    session: sessionData,
  };
};

export const signOut = async () => {
  let remoteSignOutError: unknown = null;

  await unregisterExpoPushRegistration().catch(() => undefined);

  try {
    await apiRequest("/api/auth/sign-out", {
      method: "POST",
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
    credentials: "omit",
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
    credentials: "omit",
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
    credentials: "omit",
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

export const listOwnSessions = () =>
  apiRequest<AuthSessionListResponse>("/api/auth/sessions");

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
