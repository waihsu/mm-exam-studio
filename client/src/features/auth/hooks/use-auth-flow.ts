import { useMemo, useState } from "react";
import { useRouter } from "@tanstack/react-router";
import { authApi } from "../api/auth-api";
import { useAppAuthSnapshot } from "../context/app-auth-context";
import { saveRecentAccount } from "../utils/recent-accounts";
import type {
  SignInInput,
  SignUpInput,
  UserRole,
  VerifyTwoFactorInput,
} from "../types";

export function useAuthFlow() {
  const router = useRouter();
  const auth = useAppAuthSnapshot();
  const [apiMessage, setApiMessage] = useState<string | null>(null);

  const roles = useMemo(() => auth?.roles ?? [], [auth?.roles]);

  const refresh = async () => {
    authApi.clearMeCache();
    await router.invalidate();
  };

  const signIn = async (input: SignInInput) => {
    const response = await authApi.signIn(input);
    if (!response.ok) {
      setApiMessage(response.message);
      return response;
    }

    setApiMessage(null);
    saveRecentAccount({
      email: input.email,
      name: response.ok ? auth?.user?.name ?? null : null,
    });
    await refresh();
    return { ok: true as const };
  };

  const verifyTwoFactor = async (input: VerifyTwoFactorInput) => {
    const response = await authApi.verifyTwoFactor(input);
    if (!response.ok) {
      setApiMessage(response.message ?? "Two-factor verification failed");
      return {
        ok: false as const,
        message: response.message ?? "Two-factor verification failed",
      };
    }

    setApiMessage(null);
    await refresh();
    return { ok: true as const };
  };

  const signUp = async (input: SignUpInput) => {
    const response = await authApi.signUp(input);
    if (!response.ok) {
      setApiMessage(response.message);
      return {
        ok: false as const,
        message: response.message,
      };
    }

    setApiMessage(null);
    saveRecentAccount({
      email: input.email,
      name: input.name,
    });
    await refresh();
    return { ok: true as const };
  };

  const signOut = async () => {
    const response = await authApi.signOut();
    if (!response.ok) {
      setApiMessage(response.message);
      return {
        ok: false as const,
        message: response.message,
      };
    }

    setApiMessage(null);
    await refresh();
    return { ok: true as const };
  };

  const hasRole = (role: UserRole) => roles.includes(role);

  return {
    user: auth?.user ?? null,
    session: auth?.session ?? null,
    roles,
    isStudent: hasRole("student"),
    isInstructor: hasRole("instructor"),
    isAdmin: hasRole("admin") || hasRole("superadmin"),
    isAuthenticated: auth?.isAuthenticated ?? false,
    apiMessage,
    signIn,
    verifyTwoFactor,
    signUp,
    signOut,
  };
}
