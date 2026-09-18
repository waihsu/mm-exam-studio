import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
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
    <div className="min-w-0 space-y-7 sm:space-y-8">
      <div className="min-w-0 space-y-3">
        <p className="ink-kicker text-[#48766b]">
          Account setup
        </p>
        <h1 className="text-[2.25rem] font-extrabold leading-[1.08] tracking-[-0.04em] text-[#202321] [text-wrap:balance] sm:text-[2.75rem]">
          Start with a clearer study system.
        </h1>
        <p className="max-w-sm text-[0.9375rem] leading-7 text-[#6e706b]">
          Your workspace keeps practice, question papers, and progress together without adding unnecessary steps.
        </p>
      </div>

      <form
        className="space-y-5 border-t border-[#d8d4c9] pt-7"
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
          <Label htmlFor="signup-name" className="text-[#202321]">
            Full name
          </Label>
          <Input
            id="signup-name"
            type="text"
            value={name}
            onChange={(event) => onNameChange(event.target.value)}
            className="h-12 rounded-lg border-[#d8d4c9] bg-[#fffdf8] px-4 shadow-none focus-visible:ring-[#48766b]/25"
            placeholder="Aye Aye Khine"
            autoComplete="name"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="signup-email" className="text-[#202321]">
            Email
          </Label>
          <Input
            id="signup-email"
            type="email"
            value={email}
            onChange={(event) => onEmailChange(event.target.value)}
            className="h-12 rounded-lg border-[#d8d4c9] bg-[#fffdf8] px-4 shadow-none focus-visible:ring-[#48766b]/25"
            placeholder="user@example.com"
            autoComplete="email"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="signup-password" className="text-[#202321]">
            Password
          </Label>
          <Input
            id="signup-password"
            type="password"
            value={password}
            onChange={(event) => onPasswordChange(event.target.value)}
            className="h-12 rounded-lg border-[#d8d4c9] bg-[#fffdf8] px-4 shadow-none focus-visible:ring-[#48766b]/25"
            placeholder="Choose a secure password"
            autoComplete="new-password"
            required
          />
          <p className="text-xs text-[#6e706b]">
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
          className="h-12 w-full rounded-lg bg-[#202321] text-[#fffdf8] hover:bg-[#2f3531]"
          disabled={isPending}
        >
          {isPending ? "Creating account..." : "Create account"}
          {!isPending ? <ArrowRight className="h-4 w-4" /> : null}
        </Button>
      </form>

      <p className="text-sm text-[#6e706b]">
        Already have an account?{" "}
        <Link to="/signin" className="font-semibold text-[#202321] hover:text-[#48766b]">
          Sign in
        </Link>
      </p>
    </div>
  );
}
