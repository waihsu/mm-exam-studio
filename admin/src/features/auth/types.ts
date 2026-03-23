export type UserRole = "student" | "instructor" | "admin" | "superadmin";

export type AuthUser = {
  id?: string;
  email?: string | null;
  name?: string | null;
  image?: string | null;
  twoFactorEnabled?: boolean | null;
};

export type AuthSession = {
  id?: string | null;
  expiresAt?: string | null;
};

export type AuthListedSession = {
  id: string;
  createdAt?: string | null;
  expiresAt?: string | null;
  device: string;
  bucket: "mobile" | "desktop";
  allowed: boolean;
};

export type AuthSessionsOverview = {
  currentSessionId: string;
  sessions: AuthListedSession[];
};

export type SignInInput = {
  email: string;
  password: string;
};

export type SignInResult =
  | { ok: true }
  | {
      ok: false;
      message: string;
      requiresTwoFactor?: false;
    }
  | {
      ok: false;
      message: string;
      requiresTwoFactor: true;
      challengeType: "totp_or_backup";
    };

export type VerifyTwoFactorInput = {
  code: string;
  method: "totp" | "backup";
  trustDevice?: boolean;
};

export type ForgotPasswordInput = {
  email: string;
  redirectTo?: string;
};

export type ResetPasswordInput = {
  token: string;
  newPassword: string;
};
