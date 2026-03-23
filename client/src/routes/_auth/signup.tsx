import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowRight, BadgeCheck, BookOpenCheck, FileOutput } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Notice } from "@/components/ui/notice";
import { useAuthFlow } from "@/features/auth/hooks/use-auth-flow";

export const Route = createFileRoute("/_auth/signup")({
  component: SignUpPage,
});

function SignUpPage() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const { signUp } = useAuthFlow();
  const [isPending, setIsPending] = useState(false);

  const onNameChange = (value: string) => {
    if (message) setMessage(null);
    setName(value);
  };

  const onEmailChange = (value: string) => {
    if (message) setMessage(null);
    setEmail(value);
  };

  const onPasswordChange = (value: string) => {
    if (message) setMessage(null);
    setPassword(value);
  };

  return (
    <div className="min-w-0 space-y-6 sm:space-y-7">
      <div className="min-w-0 space-y-3">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
          Account setup
        </p>
        <h2 className="text-2xl font-semibold leading-tight tracking-tight text-slate-900 [text-wrap:balance] sm:text-[2rem]">
          Start your exam workflow
        </h2>
        <p className="text-sm leading-7 text-slate-600 sm:text-[15px]">
          Create an account to unlock focused practice, question paper builder,
          and clean PDF export from your personal workspace.
        </p>
        <div className="grid gap-2 sm:grid-cols-3">
          <div className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600">
            <BookOpenCheck className="h-3.5 w-3.5 text-sky-600" />
            Guided practice
          </div>
          <div className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600">
            <FileOutput className="h-3.5 w-3.5 text-emerald-600" />
            PDF export ready
          </div>
          <div className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600">
            <BadgeCheck className="h-3.5 w-3.5 text-indigo-600" />
            One secure account
          </div>
        </div>
      </div>

      <form
        className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4 sm:p-5"
        onSubmit={async (event) => {
          event.preventDefault();
          setIsPending(true);
          try {
            const result = await signUp({ name, email, password });
            if (!result.ok) {
              setMessage(result.message);
              return;
            }
            setMessage(null);
            await navigate({ to: "/dashboard" });
          } finally {
            setIsPending(false);
          }
        }}
      >
        <div className="space-y-2">
          <Label htmlFor="signup-name" className="text-slate-800">
            Full name
          </Label>
          <Input
            id="signup-name"
            type="text"
            value={name}
            onChange={(event) => onNameChange(event.target.value)}
            className="h-12 px-4"
            placeholder="Aye Aye Khine"
            autoComplete="name"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="signup-email" className="text-slate-800">
            Email
          </Label>
          <Input
            id="signup-email"
            type="email"
            value={email}
            onChange={(event) => onEmailChange(event.target.value)}
            className="h-12 px-4"
            placeholder="user@example.com"
            autoComplete="email"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="signup-password" className="text-slate-800">
            Password
          </Label>
          <Input
            id="signup-password"
            type="password"
            value={password}
            onChange={(event) => onPasswordChange(event.target.value)}
            className="h-12 px-4"
            placeholder="Choose a secure password"
            autoComplete="new-password"
            required
          />
          <p className="text-xs text-slate-500">
            Use at least 8 characters with a mix of letters and numbers.
          </p>
        </div>

        {message ? (
          <Notice aria-live="polite" tone="error" className="px-4 py-3">
            {message}
          </Notice>
        ) : null}

        <Button
          type="submit"
          className="h-12 w-full"
          disabled={isPending}
        >
          {isPending ? "Creating account..." : "Create account"}
          {!isPending ? <ArrowRight className="h-4 w-4" /> : null}
        </Button>
      </form>

      <p className="text-sm text-slate-500">
        Already have an account?{" "}
        <Link to="/signin" className="font-semibold text-slate-900 hover:text-indigo-700">
          Sign in
        </Link>
      </p>
    </div>
  );
}
