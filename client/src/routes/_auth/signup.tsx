import { useMemo, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowRight, Check, Eye, EyeOff, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Notice } from "@/components/ui/notice";
import { useAuthFlow } from "@/features/auth/hooks/use-auth-flow";

export const Route = createFileRoute("/_auth/signup")({ component: SignUpPage });

function SignUpPage() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const { signUp } = useAuthFlow();
  const [isPending, setIsPending] = useState(false);

  const passwordChecks = useMemo(() => ({
    length: password.length >= 8,
    number: /\d/.test(password),
    match: password.length > 0 && password === confirmPassword,
  }), [password, confirmPassword]);
  const passwordScore = Object.values(passwordChecks).filter(Boolean).length;

  const clearMessage = () => { if (message) setMessage(null); };

  return (
    <div className="min-w-0 space-y-7 sm:space-y-8">
      <div className="min-w-0 space-y-4">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-indigo-700"><ShieldCheck className="h-4 w-4" /> Start securely</div>
        <h1 className="text-[2.25rem] font-extrabold leading-[1.06] tracking-[-0.05em] text-[#172033] [text-wrap:balance] sm:text-[2.9rem]">Build a better study habit.</h1>
        <p className="max-w-sm text-[0.9375rem] leading-7 text-slate-600">Create your private workspace for focused practice, question papers, and progress you can return to.</p>
      </div>

      <form className="space-y-5 border-t border-slate-200 pt-7" onSubmit={async (event) => {
        event.preventDefault();
        if (password !== confirmPassword) { setMessage("Passwords do not match."); return; }
        if (password.length < 8 || !/\d/.test(password)) { setMessage("Use at least 8 characters including one number."); return; }
        setIsPending(true);
        try {
          const result = await signUp({ name, email, password });
          if (!result.ok) { setMessage(result.message); return; }
          setMessage(null);
          await navigate({ to: "/dashboard" });
        } finally { setIsPending(false); }
      }}>
        <div className="space-y-2"><Label htmlFor="signup-name" className="text-[#172033]">Full name</Label><Input id="signup-name" type="text" value={name} onChange={(event) => { clearMessage(); setName(event.target.value); }} className="h-12 rounded-xl border-slate-200 bg-white px-4 shadow-none focus-visible:ring-indigo-500/20" placeholder="Aye Aye Khine" autoComplete="name" required /></div>
        <div className="space-y-2"><Label htmlFor="signup-email" className="text-[#172033]">Email address</Label><Input id="signup-email" type="email" value={email} onChange={(event) => { clearMessage(); setEmail(event.target.value); }} className="h-12 rounded-xl border-slate-200 bg-white px-4 shadow-none focus-visible:ring-indigo-500/20" placeholder="you@example.com" autoComplete="email" autoCapitalize="none" autoCorrect="off" spellCheck={false} required /></div>
        <div className="space-y-2"><Label htmlFor="signup-password" className="text-[#172033]">Password</Label><div className="relative"><Input id="signup-password" type={showPassword ? "text" : "password"} value={password} onChange={(event) => { clearMessage(); setPassword(event.target.value); }} className="h-12 rounded-xl border-slate-200 bg-white px-4 pr-12 shadow-none focus-visible:ring-indigo-500/20" placeholder="Choose a secure password" autoComplete="new-password" required /><button type="button" aria-label={showPassword ? "Hide password" : "Show password"} onClick={() => setShowPassword((value) => !value)} className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-slate-400 hover:text-slate-700">{showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button></div><div className="flex gap-1.5 pt-1" aria-label="Password strength"><span className={`h-1.5 flex-1 rounded-full ${passwordScore >= 1 ? "bg-indigo-500" : "bg-slate-200"}`} /><span className={`h-1.5 flex-1 rounded-full ${passwordScore >= 2 ? "bg-indigo-500" : "bg-slate-200"}`} /><span className={`h-1.5 flex-1 rounded-full ${passwordScore >= 3 ? "bg-emerald-500" : "bg-slate-200"}`} /></div><p className="text-xs text-slate-500">At least 8 characters, one number, and a matching confirmation.</p></div>
        <div className="space-y-2"><Label htmlFor="signup-confirm-password" className="text-[#172033]">Confirm password</Label><Input id="signup-confirm-password" type={showPassword ? "text" : "password"} value={confirmPassword} onChange={(event) => { clearMessage(); setConfirmPassword(event.target.value); }} className="h-12 rounded-xl border-slate-200 bg-white px-4 shadow-none focus-visible:ring-indigo-500/20" placeholder="Repeat your password" autoComplete="new-password" required /></div>
        {message ? <Notice aria-live="polite" tone="error" className="px-4 py-3">{message}</Notice> : null}
        <Button type="submit" className="h-12 w-full rounded-xl bg-[#172033] text-white shadow-lg shadow-[#172033]/10 hover:bg-[#293650]" disabled={isPending}>{isPending ? "Creating workspace..." : "Create workspace"}{!isPending ? <ArrowRight className="h-4 w-4" /> : null}</Button>
        <p className="text-center text-xs leading-5 text-slate-500">By creating an account, you can start using the core study workspace without payment gates.</p>
      </form>

      <div className="flex items-center justify-between gap-3 border-t border-slate-200 pt-5 text-sm"><span className="text-slate-500">Already have an account?</span><Link to="/signin" className="font-bold text-[#172033] hover:text-indigo-700">Sign in <ArrowRight className="ml-1 inline h-3.5 w-3.5" /></Link></div>
      <div className="flex items-start gap-2 text-xs leading-5 text-slate-500"><Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />Your practice sessions and paper drafts stay in your private workspace.</div>
    </div>
  );
}
