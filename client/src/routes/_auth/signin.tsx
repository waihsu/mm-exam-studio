import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowRight, Clock3, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Notice } from "@/components/ui/notice";
import { useAuthFlow } from "@/features/auth/hooks/use-auth-flow";
import {
  listRecentAccounts,
  removeRecentAccount,
} from "@/features/auth/utils/recent-accounts";
import { normalizeRedirectPath } from "@/features/auth/utils/app-auth";

type SignInSearch = {
  redirect?: string;
};

export const Route = createFileRoute("/_auth/signin")({
  validateSearch: (search): SignInSearch => ({
    redirect: typeof search.redirect === "string" ? search.redirect : undefined,
  }),
  component: SignInPage,
});

function SignInPage() {
  const navigate = useNavigate();
  const search = Route.useSearch();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mfaCode, setMfaCode] = useState("");
  const [mfaMethod, setMfaMethod] = useState<"totp" | "backup">("totp");
  const [isMfaRequired, setIsMfaRequired] = useState(false);
  const [isVerifyingMfa, setIsVerifyingMfa] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const { signIn, verifyTwoFactor } = useAuthFlow();
  const [isPending, setIsPending] = useState(false);
  const [recentAccounts, setRecentAccounts] = useState(() => listRecentAccounts());

  const onEmailChange = (value: string) => {
    if (message) setMessage(null);
    if (isMfaRequired) {
      setIsMfaRequired(false);
      setMfaCode("");
    }
    setEmail(value);
  };

  const onPasswordChange = (value: string) => {
    if (message) setMessage(null);
    if (isMfaRequired) {
      setIsMfaRequired(false);
      setMfaCode("");
    }
    setPassword(value);
  };

  return (
    <div className="min-w-0 space-y-7 sm:space-y-8">
      <div className="min-w-0 space-y-3">
        <p className="ink-kicker text-indigo-700">
          Secure account access
        </p>
        <h1 className="text-[2.25rem] font-extrabold leading-[1.08] tracking-[-0.04em] text-[#202536] [text-wrap:balance] sm:text-[2.75rem]">
          Pick up where you left off.
        </h1>
        <p className="max-w-sm text-[0.9375rem] leading-7 text-slate-600">
          Your saved practice, paper drafts, and exports are ready in one place.
        </p>
      </div>

      <form
        className="space-y-5 border-t border-[#d8d5ca] pt-7"
        onSubmit={async (event) => {
          event.preventDefault();
          setIsPending(true);
          try {
            const result = await signIn({ email, password });
            if (!result.ok) {
              setMessage(result.message);
              if (result.requiresTwoFactor) {
                setIsMfaRequired(true);
                setMfaCode("");
                setMfaMethod("totp");
              } else {
                setIsMfaRequired(false);
              }
              return;
            }
            setIsMfaRequired(false);
            setMessage(null);
            await navigate({ to: normalizeRedirectPath(search.redirect) });
          } finally {
            setIsPending(false);
          }
        }}
      >
        <div className="space-y-2">
          <Label htmlFor="signin-email" className="text-slate-800">
            Email
          </Label>
          <Input
            id="signin-email"
            type="email"
            value={email}
            onChange={(event) => onEmailChange(event.target.value)}
          className="h-12 rounded-lg border-[#cfcbbf] bg-white px-4 shadow-none focus-visible:ring-indigo-500/20"
            placeholder="user@example.com"
            autoComplete="email"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="signin-password" className="text-slate-800">
            Password
          </Label>
          <Input
            id="signin-password"
            type="password"
            value={password}
            onChange={(event) => onPasswordChange(event.target.value)}
          className="h-12 rounded-lg border-[#cfcbbf] bg-white px-4 shadow-none focus-visible:ring-indigo-500/20"
            placeholder="Enter your password"
            autoComplete="current-password"
            required
          />
        </div>

        {message ? (
          <Notice aria-live="polite" tone="error" className="px-4 py-3">
            {message}
          </Notice>
        ) : null}

        <Button
          type="submit"
          className="h-12 w-full rounded-lg bg-[#202536] text-white shadow-[0_12px_24px_-16px_rgba(32,37,54,0.7)] hover:bg-[#30364d]"
          disabled={isPending}
        >
          {isPending ? "Signing in..." : "Sign in"}
          {!isPending ? <ArrowRight className="h-4 w-4" /> : null}
        </Button>

        {isMfaRequired ? (
          <div className="space-y-3 rounded-xl border border-sky-200 bg-sky-50/60 px-4 py-3">
            <p className="text-sm font-semibold text-slate-900">Two-factor verification</p>
            <p className="text-xs text-slate-600">
              Use your authenticator app code or one backup code to continue.
            </p>
            <div className="space-y-2">
              <Label htmlFor="signin-mfa-code" className="text-slate-800">
                Verification code
              </Label>
              <Input
                id="signin-mfa-code"
                value={mfaCode}
                onChange={(event) => setMfaCode(event.target.value)}
                autoComplete="one-time-code"
                placeholder={mfaMethod === "totp" ? "123456" : "ABCDE-FGHIJ"}
                required
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant={mfaMethod === "totp" ? "default" : "outline"}
                onClick={() => setMfaMethod("totp")}
              >
                Authenticator
              </Button>
              <Button
                type="button"
                variant={mfaMethod === "backup" ? "default" : "outline"}
                onClick={() => setMfaMethod("backup")}
              >
                Backup Code
              </Button>
            </div>
            <Button
              type="button"
              className="w-full"
              disabled={isVerifyingMfa || mfaCode.trim().length < 3}
              onClick={async () => {
                setIsVerifyingMfa(true);
                try {
                  const result = await verifyTwoFactor({
                    code: mfaCode,
                    method: mfaMethod,
                    trustDevice: true,
                  });
                  if (!result.ok) {
                    setMessage(result.message);
                    return;
                  }
                  setMessage(null);
                  await navigate({ to: normalizeRedirectPath(search.redirect) });
                } finally {
                  setIsVerifyingMfa(false);
                }
              }}
            >
              {isVerifyingMfa ? "Verifying..." : "Verify and continue"}
            </Button>
          </div>
        ) : null}
      </form>

      {recentAccounts.length > 0 ? (
        <div className="border-y border-[#d8d5ca] py-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="ink-kicker text-slate-500">
                Recent accounts
              </p>
              <p className="mt-1 text-sm text-slate-500 leading-6">
                Use previous sessions on this device without typing full email.
              </p>
            </div>
          </div>
          <div className="stagger-children mt-4 max-h-52 space-y-3 overflow-y-auto pr-1 sm:max-h-none sm:overflow-visible sm:pr-0">
            {recentAccounts.map((account) => (
              <div
                key={account.email}
                className="flex items-center justify-between gap-3 rounded-lg border border-[#dfdcd2] bg-[#f7f6f0] px-4 py-3 transition hover:border-[#bbb7aa] hover:bg-white"
              >
                <button
                  type="button"
                  onClick={() => setEmail(account.email)}
                  className="min-w-0 flex-1 text-left"
                >
                  <p className="truncate font-semibold text-slate-900">
                    {account.name || account.email}
                  </p>
                  <p className="mt-1 truncate text-sm text-slate-500">{account.email}</p>
                </button>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="bg-white"
                    onClick={() => setEmail(account.email)}
                  >
                    Use
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="bg-white"
                    onClick={() => {
                      removeRecentAccount(account.email);
                      setRecentAccounts((current) =>
                        current.filter((item) => item.email !== account.email),
                      );
                    }}
                  >
                    <X className="h-4 w-4" />
                    <span className="sr-only">Remove recent account</span>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
        <Link
          to="/forgot-password"
          className="inline-flex items-center gap-2 text-slate-500 transition hover:text-slate-900"
        >
          <Clock3 className="h-4 w-4" />
          Forgot password?
        </Link>
        <p className="text-slate-500">
          New here?{" "}
          <Link to="/signup" className="font-semibold text-slate-900 hover:text-indigo-700">
            Create your account
          </Link>
        </p>
      </div>
    </div>
  );
}
