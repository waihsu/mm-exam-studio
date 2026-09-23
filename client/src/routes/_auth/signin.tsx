import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowRight, Clock3, Eye, EyeOff, ShieldCheck, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Notice } from "@/components/ui/notice";
import { useAuthFlow } from "@/features/auth/hooks/use-auth-flow";
import { listRecentAccounts, removeRecentAccount } from "@/features/auth/utils/recent-accounts";
import { normalizeRedirectPath } from "@/features/auth/utils/app-auth";

type SignInSearch = { redirect?: string };

export const Route = createFileRoute("/_auth/signin")({
  validateSearch: (search): SignInSearch => ({ redirect: typeof search.redirect === "string" ? search.redirect : undefined }),
  component: SignInPage,
});

function SignInPage() {
  const navigate = useNavigate();
  const search = Route.useSearch();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [mfaCode, setMfaCode] = useState("");
  const [mfaMethod, setMfaMethod] = useState<"totp" | "backup">("totp");
  const [isMfaRequired, setIsMfaRequired] = useState(false);
  const [isVerifyingMfa, setIsVerifyingMfa] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [recentAccounts, setRecentAccounts] = useState(() => listRecentAccounts());
  const { signIn, verifyTwoFactor } = useAuthFlow();

  const onEmailChange = (value: string) => { setMessage(null); setIsMfaRequired(false); setMfaCode(""); setEmail(value); };
  const onPasswordChange = (value: string) => { setMessage(null); setIsMfaRequired(false); setMfaCode(""); setPassword(value); };

  return (
    <div className="min-w-0 space-y-7 sm:space-y-8">
      <div className="min-w-0 space-y-4">
        <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-indigo-700"><ShieldCheck className="h-4 w-4" /> Secure workspace access</p>
        <h1 className="text-[2.25rem] font-extrabold leading-[1.06] tracking-[-0.05em] text-[#172033] [text-wrap:balance] sm:text-[2.9rem]">Welcome back to focused study.</h1>
        <p className="max-w-sm text-[0.9375rem] leading-7 text-slate-600">Continue your practice sessions, paper drafts, and progress from one calm workspace.</p>
      </div>

      <form className="space-y-5 border-t border-slate-200 pt-7" onSubmit={async (event) => {
        event.preventDefault();
        setIsPending(true);
        try {
          const result = await signIn({ email, password });
          if (!result.ok) { setMessage(result.message); setIsMfaRequired(Boolean(result.requiresTwoFactor)); if (result.requiresTwoFactor) { setMfaCode(""); setMfaMethod("totp"); } return; }
          setIsMfaRequired(false); setMessage(null); await navigate({ to: normalizeRedirectPath(search.redirect) });
        } finally { setIsPending(false); }
      }}>
        <div className="space-y-2"><Label htmlFor="signin-email" className="text-[#172033]">Email address</Label><Input id="signin-email" type="email" value={email} onChange={(event) => onEmailChange(event.target.value)} className="h-12 rounded-xl border-slate-200 bg-white px-4 shadow-none focus-visible:ring-indigo-500/20" placeholder="you@example.com" autoComplete="email" autoCapitalize="none" autoCorrect="off" spellCheck={false} required /></div>
        <div className="space-y-2"><Label htmlFor="signin-password" className="text-[#172033]">Password</Label><div className="relative"><Input id="signin-password" type={showPassword ? "text" : "password"} value={password} onChange={(event) => onPasswordChange(event.target.value)} className="h-12 rounded-xl border-slate-200 bg-white px-4 pr-12 shadow-none focus-visible:ring-indigo-500/20" placeholder="Enter your password" autoComplete="current-password" required /><button type="button" aria-label={showPassword ? "Hide password" : "Show password"} onClick={() => setShowPassword((value) => !value)} className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-slate-400 hover:text-slate-700">{showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button></div></div>
        {message ? <Notice aria-live="polite" tone="error" className="px-4 py-3">{message}</Notice> : null}
        <Button type="submit" className="h-12 w-full rounded-xl bg-[#172033] text-white shadow-lg shadow-[#172033]/10 hover:bg-[#293650]" disabled={isPending}>{isPending ? "Signing in..." : "Sign in"}{!isPending ? <ArrowRight className="h-4 w-4" /> : null}</Button>

        {isMfaRequired ? <div className="space-y-3 rounded-xl border border-indigo-100 bg-indigo-50/70 px-4 py-3"><p className="text-sm font-semibold text-[#172033]">Two-factor verification</p><p className="text-xs text-slate-600">Use your authenticator app code or one backup code to continue.</p><div className="space-y-2"><Label htmlFor="signin-mfa-code" className="text-[#172033]">Verification code</Label><Input id="signin-mfa-code" value={mfaCode} onChange={(event) => setMfaCode(event.target.value)} autoComplete="one-time-code" placeholder={mfaMethod === "totp" ? "123456" : "ABCDE-FGHIJ"} required /></div><div className="flex flex-wrap gap-2"><Button type="button" variant={mfaMethod === "totp" ? "default" : "outline"} onClick={() => setMfaMethod("totp")}>Authenticator</Button><Button type="button" variant={mfaMethod === "backup" ? "default" : "outline"} onClick={() => setMfaMethod("backup")}>Backup code</Button></div><Button type="button" className="w-full rounded-xl" disabled={isVerifyingMfa || mfaCode.trim().length < 3} onClick={async () => { setIsVerifyingMfa(true); try { const result = await verifyTwoFactor({ code: mfaCode, method: mfaMethod, trustDevice: true }); if (!result.ok) { setMessage(result.message); return; } setMessage(null); await navigate({ to: normalizeRedirectPath(search.redirect) }); } finally { setIsVerifyingMfa(false); } }}>{isVerifyingMfa ? "Verifying..." : "Verify and continue"}</Button></div> : null}
      </form>

      {recentAccounts.length > 0 ? <div className="border-y border-slate-200 py-5"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Recent accounts</p><p className="mt-1 text-sm leading-6 text-slate-500">Use a previous account on this device without typing the full email.</p></div><div className="mt-4 max-h-52 space-y-3 overflow-y-auto pr-1 sm:max-h-none sm:overflow-visible sm:pr-0">{recentAccounts.map((account) => <div key={account.email} className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 transition hover:border-indigo-300 hover:bg-indigo-50/30"><button type="button" onClick={() => setEmail(account.email)} className="min-w-0 flex-1 text-left"><p className="truncate font-semibold text-[#172033]">{account.name || account.email}</p><p className="mt-1 truncate text-sm text-slate-500">{account.email}</p></button><div className="flex items-center gap-2"><Button type="button" variant="outline" className="bg-white" onClick={() => setEmail(account.email)}>Use</Button><Button type="button" variant="outline" size="icon" className="bg-white" onClick={() => { removeRecentAccount(account.email); setRecentAccounts((current) => current.filter((item) => item.email !== account.email)); }}><X className="h-4 w-4" /><span className="sr-only">Remove recent account</span></Button></div></div>)}</div></div> : null}

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-5 text-sm"><Link to="/forgot-password" className="inline-flex items-center gap-2 text-slate-500 transition hover:text-[#172033]"><Clock3 className="h-4 w-4" />Forgot password?</Link><p className="text-slate-500">New here? <Link to="/signup" className="font-bold text-[#172033] hover:text-indigo-700">Create your workspace</Link></p></div>
    </div>
  );
}
