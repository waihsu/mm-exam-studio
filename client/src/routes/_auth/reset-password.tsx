import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, CircleCheck, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Notice } from "@/components/ui/notice";
import { authApi } from "@/features/auth/api/auth-api";

type ResetPasswordSearch = {
  token?: string;
  error?: string;
};

export const Route = createFileRoute("/_auth/reset-password")({
  validateSearch: (search): ResetPasswordSearch => ({
    token: typeof search.token === "string" ? search.token : undefined,
    error: typeof search.error === "string" ? search.error : undefined,
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const { token, error } = Route.useSearch();
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const resetMutation = useMutation({
    mutationFn: () => authApi.resetPassword({ token: token ?? "", newPassword: password }),
    onSuccess: (result) => {
      setMessage(result.ok ? null : result.message);
    },
  });

  const tokenError = error === "INVALID_TOKEN" || !token;
  const passwordError = password.length > 0 && password.length < 8
    ? "Use at least 8 characters."
    : confirmation.length > 0 && password !== confirmation
      ? "Passwords do not match."
      : null;
  const completed = resetMutation.data?.ok === true;

  if (completed) {
    return (
      <div className="space-y-6">
        <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700"><CircleCheck className="h-6 w-6" /></div>
        <div><p className="ink-kicker text-emerald-700">Password updated</p><h1 className="mt-3 text-[2.25rem] font-extrabold leading-[1.08] tracking-[-0.04em] text-[#202536]">You can sign in now.</h1><p className="mt-3 text-[0.9375rem] leading-7 text-slate-600">For your protection, any previous sessions have been signed out.</p></div>
        <Button asChild className="h-12 rounded-lg bg-[#202536] px-5 text-white hover:bg-[#30364d]"><Link to="/signin">Continue to sign in <ArrowRight className="h-4 w-4" /></Link></Button>
      </div>
    );
  }

  return (
    <div className="min-w-0 space-y-7 sm:space-y-8">
      <div className="min-w-0 space-y-3">
        <p className="ink-kicker text-indigo-700">Password reset</p>
        <h1 className="text-[2.25rem] font-extrabold leading-[1.08] tracking-[-0.04em] text-[#202536] [text-wrap:balance] sm:text-[2.75rem]">Choose a new password.</h1>
        <p className="max-w-sm text-[0.9375rem] leading-7 text-slate-600">Use a password you have not used elsewhere. We will sign out your other sessions when it is updated.</p>
      </div>

      {tokenError ? <Notice tone="error">This reset link is invalid or has expired. Request a new one to continue.</Notice> : null}

      <form
        className="space-y-5 border-t border-[#d8d5ca] pt-7"
        onSubmit={(event) => {
          event.preventDefault();
          if (tokenError || passwordError || resetMutation.isPending) return;
          void resetMutation.mutateAsync();
        }}
      >
        <div className="space-y-2">
          <Label htmlFor="reset-password" className="text-slate-800">New password</Label>
          <Input id="reset-password" type="password" value={password} onChange={(event) => { setPassword(event.target.value); setMessage(null); }} className="h-12 rounded-lg border-[#cfcbbf] bg-white px-4 shadow-none focus-visible:ring-indigo-500/20" placeholder="Choose a secure password" autoComplete="new-password" required disabled={tokenError} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="reset-password-confirmation" className="text-slate-800">Confirm new password</Label>
          <Input id="reset-password-confirmation" type="password" value={confirmation} onChange={(event) => { setConfirmation(event.target.value); setMessage(null); }} className="h-12 rounded-lg border-[#cfcbbf] bg-white px-4 shadow-none focus-visible:ring-indigo-500/20" placeholder="Type it again" autoComplete="new-password" required disabled={tokenError} />
          {passwordError ? <p className="text-sm font-medium text-rose-700">{passwordError}</p> : <p className="text-sm text-slate-500">Use at least 8 characters.</p>}
        </div>
        {message ? <Notice tone="error">{message}</Notice> : null}
        <Button type="submit" disabled={tokenError || Boolean(passwordError) || password.length < 8 || resetMutation.isPending} className="h-12 w-full rounded-lg bg-[#202536] text-white hover:bg-[#30364d]">{resetMutation.isPending ? "Updating password..." : "Update password"}<KeyRound className="h-4 w-4" /></Button>
      </form>

      <p className="text-sm text-slate-500">Need another link? <Link to="/forgot-password" className="font-semibold text-slate-900 hover:text-indigo-700">Request password reset</Link></p>
    </div>
  );
}
