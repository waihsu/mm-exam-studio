import { createFileRoute, useNavigate, useRouter } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ADMIN_ROUTES } from "@/constants/routes";
import { GlassSignInCard } from "@/features/auth/components/glass-sign-in-card";
import { useAuthFlow } from "@/features/auth/hooks/use-auth-flow";
import { loadAdminAuthSnapshot } from "@/features/auth/utils/admin-auth";

type SignInSearch = {
  redirect?: string;
};

const normalizeRedirect = (value: string | undefined) => {
  if (!value || !value.startsWith("/")) {
    return ADMIN_ROUTES.dashboard;
  }

  if (value === ADMIN_ROUTES.signIn || value === ADMIN_ROUTES.signUp) {
    return ADMIN_ROUTES.dashboard;
  }

  return value;
};

export const Route = createFileRoute("/_auth/signin")({
  validateSearch: (search): SignInSearch => ({
    redirect:
      typeof search.redirect === "string" ? search.redirect : undefined,
  }),
  component: SignInPage,
});

function SignInPage() {
  const navigate = useNavigate();
  const router = useRouter();
  const search = Route.useSearch();
  const { signIn, signInWithGoogle, verifyTwoFactor } = useAuthFlow();
  const [isMfaRequired, setIsMfaRequired] = useState(false);
  const [mfaCode, setMfaCode] = useState("");
  const [mfaMethod, setMfaMethod] = useState<"totp" | "backup">("totp");
  const [mfaMessage, setMfaMessage] = useState<string | null>(null);
  const [isVerifyingMfa, setIsVerifyingMfa] = useState(false);
  const redirectTo = normalizeRedirect(search.redirect);

  return (
    <div className="w-full max-w-md space-y-4">
      <GlassSignInCard
        brandLabel="Study Admin"
        title="Sign in to the admin console"
        description="Only admin and superadmin accounts can continue into this workspace."
        googleLabel="Continue with Google"
        submitLabel="Sign in"
        onSubmit={async (input) => {
          const result = await signIn(input);
          if (!result.ok) {
            if (result.requiresTwoFactor) {
              setIsMfaRequired(true);
              setMfaCode("");
              setMfaMethod("totp");
              setMfaMessage(result.message);
            } else {
              setIsMfaRequired(false);
              setMfaMessage(result.message ?? "Sign in failed");
            }
            return false;
          }

          setIsMfaRequired(false);
          setMfaMessage(null);

          const auth = await loadAdminAuthSnapshot();
          await router.invalidate();
          await navigate({
            to: auth.canAccessAdmin ? redirectTo : ADMIN_ROUTES.forbidden,
          });
          return true;
        }}
        onGoogleSignIn={async () => {
          await signInWithGoogle(redirectTo);
        }}
      />
      {isMfaRequired ? (
        <form
          className="space-y-3 rounded-2xl border border-sky-200/80 bg-sky-50/70 p-4"
          onSubmit={async (event) => {
            event.preventDefault();
            const code = mfaCode.trim();
            if (!code) {
              setMfaMessage("Enter your authenticator or backup code.");
              return;
            }

            setIsVerifyingMfa(true);
            try {
              const result = await verifyTwoFactor({
                code,
                method: mfaMethod,
                trustDevice: true,
              });
              if (!result.ok) {
                setMfaMessage(result.message ?? "Invalid two-factor code.");
                return;
              }

              setMfaMessage(null);
              const auth = await loadAdminAuthSnapshot();
              await router.invalidate();
              await navigate({
                to: auth.canAccessAdmin ? redirectTo : ADMIN_ROUTES.forbidden,
              });
            } finally {
              setIsVerifyingMfa(false);
            }
          }}
        >
          <div className="space-y-1">
            <p className="text-sm font-semibold text-slate-900">Two-factor verification</p>
            <p className="text-xs text-slate-600">
              Enter your 6-digit authenticator code or a backup code to continue.
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="admin-mfa-code">Code</Label>
            <Input
              id="admin-mfa-code"
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
          {mfaMessage ? (
            <p className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-700">
              {mfaMessage}
            </p>
          ) : null}
          <Button type="submit" disabled={isVerifyingMfa} className="w-full">
            {isVerifyingMfa ? "Verifying..." : "Verify and continue"}
          </Button>
        </form>
      ) : null}
      <div className="rounded-2xl border border-white/70 bg-white/80 p-4 text-sm text-slate-600 shadow-[0_18px_48px_-30px_rgba(15,23,42,0.45)]">
        <p>
          Don&apos;t have admin permission yet? Ask a superadmin to assign the
          role first.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button asChild variant="outline" className="border-slate-300/80 bg-white">
            <Link to={ADMIN_ROUTES.signUp}>Request access</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
