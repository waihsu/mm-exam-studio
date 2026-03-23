import { useCallback, useMemo, useState } from "react";
import { useRouter } from "@tanstack/react-router";
import { toast } from "@/components/ui/sonner";
import { authApi } from "../api/auth-api";
import { useAdminAuthSnapshot } from "../context/admin-auth-context";
import type {
  AuthUser,
  SignInInput,
  SignInResult,
  UserRole,
  VerifyTwoFactorInput,
} from "../types";

type UseAuthFlowResult = {
  isPending: boolean;
  isRolesPending: boolean;
  user: AuthUser | null;
  roles: UserRole[];
  isStudent: boolean;
  isInstructor: boolean;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  hasRole(role: UserRole): boolean;
  apiMessage: string | null;
  signIn(input: SignInInput): Promise<SignInResult>;
  verifyTwoFactor(input: VerifyTwoFactorInput): Promise<{ ok: boolean; message?: string }>;
  signInWithGoogle(callbackURL?: string): Promise<boolean>;
  signOut(): Promise<boolean>;
  revokeOtherSessions(): Promise<boolean>;
  callProtectedApi(): Promise<void>;
};

export function useAuthFlow(): UseAuthFlowResult {
  const router = useRouter();
  const auth = useAdminAuthSnapshot();
  const [apiMessage, setApiMessage] = useState<string | null>(null);
  const user = auth?.user ?? null;
  const roles = useMemo(() => auth?.roles ?? [], [auth?.roles]);

  const signIn = async (input: SignInInput) => {
    const response = await authApi.signIn(input);
    if (!response.ok) {
      if (response.requiresTwoFactor) {
        setApiMessage(response.message);
        toast.info("Two-factor code required");
        return response;
      }

      toast.error(response.message ?? "Sign in failed");
      setApiMessage(response.message ?? "Sign in failed");
      return response;
    }

    toast.success("Sign in successful");
    setApiMessage(null);
    authApi.clearMeCache();
    await router.invalidate();
    return response;
  };

  const verifyTwoFactor = async (input: VerifyTwoFactorInput) => {
    const response = await authApi.verifyTwoFactor(input);
    if (!response.ok) {
      toast.error(response.message ?? "Two-factor verification failed");
      setApiMessage(response.message ?? "Two-factor verification failed");
      return { ok: false as const, message: response.message };
    }

    toast.success("Two-factor verification successful");
    setApiMessage(null);
    authApi.clearMeCache();
    await router.invalidate();
    return { ok: true as const };
  };

  const signInWithGoogle = async (callbackURL = "/") => {
    const response = (await authApi.signInWithGoogle(callbackURL)) as
      | {
          error?: { message?: string } | null;
          data?: { url?: string } | null;
          url?: string | null;
        }
      | undefined;

    if (response?.error) {
      toast.error(response.error.message ?? "Google sign in failed");
      return false;
    }

    const redirectURL =
      typeof response?.data?.url === "string"
        ? response.data.url
        : typeof response?.url === "string"
          ? response.url
          : null;

    if (!redirectURL) {
      toast.error("Google sign in did not return a redirect URL");
      return false;
    }

    window.location.href = redirectURL;
    return true;
  };

  const signOut = async () => {
    const response = await authApi.signOut();
    if (response.error) {
      toast.error(response.error.message ?? "Sign out failed");
      return false;
    }

    toast.success("Signed out");
    authApi.clearMeCache();
    await router.invalidate();
    return true;
  };

  const revokeOtherSessions = async () => {
    const response = await authApi.revokeOtherSessions();
    if (!response.ok) {
      toast.error(response.message);
      return false;
    }

    toast.success(
      response.revokedCount > 0
        ? `Revoked ${response.revokedCount} other session(s)`
        : "No other active sessions",
    );
    authApi.clearMeCache();
    await router.invalidate();
    return true;
  };

  const callProtectedApi = async () => {
    setApiMessage(null);
    const result = await authApi.fetchProtectedUser();
    if (!result.ok) {
      toast.error(result.message);
      setApiMessage(result.message);
      return;
    }

    toast.success("Protected API success");
    setApiMessage(result.message);
  };

  const roleSet = useMemo(() => new Set(roles), [roles]);
  const hasRole = useCallback((role: UserRole) => roleSet.has(role), [roleSet]);

  return {
    isPending: false,
    isRolesPending: false,
    user,
    roles,
    isStudent: hasRole("student"),
    isInstructor: hasRole("instructor"),
    isAdmin: hasRole("admin") || hasRole("superadmin"),
    isSuperAdmin: hasRole("superadmin"),
    hasRole,
    apiMessage,
    signIn,
    verifyTwoFactor,
    signInWithGoogle,
    signOut,
    revokeOtherSessions,
    callProtectedApi,
  };
}
