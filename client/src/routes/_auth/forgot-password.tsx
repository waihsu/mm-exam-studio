import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, Clock3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Notice } from "@/components/ui/notice";
import { authApi } from "@/features/auth/api/auth-api";

export const Route = createFileRoute("/_auth/forgot-password")({
  component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
  const [email, setEmail] = useState("");

  const resetMutation = useMutation({
    mutationFn: async () =>
      authApi.requestPasswordReset({
        email,
        redirectTo: "/signin",
      }),
  });

  const resetResponse = resetMutation.data;
  const successMessage = resetResponse?.ok ? resetResponse.message : null;
  const errorMessage = resetResponse && !resetResponse.ok ? resetResponse.message : null;

  return (
    <div className="min-w-0 space-y-6 sm:space-y-7">
      <div className="min-w-0 space-y-3">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
          Password reset
        </p>
        <h2 className="text-2xl font-semibold leading-tight tracking-tight text-slate-900 [text-wrap:balance] sm:text-[2rem]">
          Trouble signing in?
        </h2>
        <p className="text-sm leading-7 text-slate-600 sm:text-[15px]">
          Enter your account email. We will send a reset link so you can access your workspace again.
        </p>
      </div>

      <form
        className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4 sm:p-5"
        onSubmit={(event) => {
          event.preventDefault();
          if (email.trim().length < 3 || resetMutation.isPending) return;
          void resetMutation.mutateAsync();
        }}
      >
        <div className="space-y-2">
          <Label htmlFor="forgot-email" className="text-slate-800">
            Email address
          </Label>
          <Input
            id="forgot-email"
            type="email"
            value={email}
            onChange={(event) => {
              setEmail(event.target.value);
              if (resetMutation.data) {
                resetMutation.reset();
              }
            }}
            placeholder="you@example.com"
            autoComplete="email"
            required
            className="h-12 px-4"
          />
        </div>

        {errorMessage ? <Notice tone="error">{errorMessage}</Notice> : null}
        {successMessage ? <Notice tone="success">{successMessage}</Notice> : null}

        <Button
          type="submit"
          disabled={resetMutation.isPending || email.trim().length < 3}
          className="h-12 w-full"
        >
          {resetMutation.isPending ? "Sending..." : "Send reset link"}
          {!resetMutation.isPending ? <ArrowRight className="h-4 w-4" /> : null}
        </Button>
      </form>

      <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
        <Link
          to="/signin"
          className="inline-flex items-center gap-2 text-slate-500 transition hover:text-slate-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to sign in
        </Link>
        <p className="inline-flex items-center gap-2 text-slate-500">
          <Clock3 className="h-4 w-4" />
          Reset links expire for safety
        </p>
      </div>
    </div>
  );
}
