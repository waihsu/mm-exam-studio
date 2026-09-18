import { useState } from "react";
import type { FormEvent } from "react";
import type { SignUpCardInput } from "../../../../../shared/src/ui/auth/types";

type GlassSignUpCardProps = {
  brandLabel?: string;
  title?: string;
  description?: string;
  googleLabel?: string;
  submitLabel?: string;
  onSubmit: (input: SignUpCardInput) => Promise<boolean>;
  onGoogleSignIn: () => Promise<void>;
};

const initialForm: SignUpCardInput = {
  name: "",
  email: "",
  password: "",
};

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function GlassSignUpCard({
  brandLabel = "App",
  title = "Create account",
  description = "Start your onboarding.",
  googleLabel = "Sign up with Google",
  submitLabel = "Create account",
  onSubmit,
  onGoogleSignIn,
}: GlassSignUpCardProps) {
  const [form, setForm] = useState<SignUpCardInput>(initialForm);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const name = form.name.trim();
    const email = form.email.trim();
    const password = form.password;

    if (!name || !email || !password) {
      setFormError("Name, email, and password are required.");
      return;
    }
    if (!emailPattern.test(email)) {
      setFormError("Enter a valid email address.");
      return;
    }
    if (password.length < 6) {
      setFormError("Password must be at least 6 characters.");
      return;
    }

    setFormError(null);
    setIsSubmitting(true);
    try {
      await onSubmit({
        name,
        email,
        password,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative w-full overflow-hidden rounded-[22px] border border-[#d8d4c9] bg-[#fffdf8] p-6 shadow-[0_24px_56px_-38px_rgba(32,35,33,0.3)]">
      <div className="pointer-events-none absolute -right-12 -top-12 h-36 w-36 rounded-full bg-[#e7efe9] blur-3xl" />
      <div className="pointer-events-none absolute -bottom-10 -left-8 h-32 w-32 rounded-full bg-[#f5e4da] blur-3xl" />

      <form className="relative space-y-3" onSubmit={handleSubmit}>
        <p className="admin-kicker text-[#48766b]">
          {brandLabel}
        </p>
        <p className="text-2xl font-semibold text-[#202321]">{title}</p>
        <p className="text-sm leading-6 text-[#6e706b]">{description}</p>

        <button
          type="button"
          onClick={() => {
            setIsGoogleLoading(true);
            void onGoogleSignIn().finally(() => {
              setIsGoogleLoading(false);
            });
          }}
          disabled={isSubmitting || isGoogleLoading}
          className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg border border-[#d8d4c9] bg-[#fffdf8] px-3 text-sm font-semibold text-[#202321] transition hover:border-[#7fa99d] hover:bg-[#f8f5ee]"
        >
          <svg viewBox="0 0 48 48" aria-hidden className="h-4 w-4">
            <path
              fill="#FFC107"
              d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.7 1.1 7.8 2.9l5.7-5.7C34 6.1 29.3 4 24 4 13 4 4 13 4 24s9 20 20 20 20-9 20-20c0-1.3-.1-2.3-.4-3.5z"
            />
            <path
              fill="#FF3D00"
              d="M6.3 14.7l6.6 4.8C14.7 15 18.9 12 24 12c3 0 5.7 1.1 7.8 2.9l5.7-5.7C34 6.1 29.3 4 24 4c-7.7 0-14.4 4.3-17.7 10.7z"
            />
            <path
              fill="#4CAF50"
              d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2c-2 1.4-4.4 2.4-7.2 2.4-5.3 0-9.8-3.3-11.4-8l-6.6 5.1C9.2 39.5 16 44 24 44z"
            />
            <path
              fill="#1976D2"
              d="M43.6 20.5H42V20H24v8h11.3c-1 3-3 5.4-5.9 7.1l.1-.1 6.2 5.2C35.2 40.5 44 34 44 24c0-1.3-.1-2.3-.4-3.5z"
            />
          </svg>
          {isGoogleLoading ? "Redirecting..." : googleLabel}
        </button>

        <div className="flex items-center gap-2 text-xs text-[#6e706b]">
          <div className="h-px flex-1 bg-[#d8d4c9]" />
          <span>or use email</span>
          <div className="h-px flex-1 bg-[#d8d4c9]" />
        </div>

        <label className="grid gap-1.5 text-sm">
          <span className="font-medium text-[#202321]">Full name</span>
          <input
            className="h-11 w-full rounded-lg border border-[#d8d4c9] bg-[#fffdf8] px-3 text-[#202321] outline-none transition placeholder:text-[#a8ada5] focus:border-[#48766b] focus:ring-4 focus:ring-[#48766b]/10"
            autoComplete="name"
            placeholder="Your full name"
            value={form.name}
            onChange={(event) => {
              const value = (event.target as HTMLInputElement).value;
              setForm((current) => ({
                ...current,
                name: value,
              }));
            }}
          />
        </label>
        <label className="grid gap-1.5 text-sm">
          <span className="font-medium text-[#202321]">Email</span>
          <input
            className="h-11 w-full rounded-lg border border-[#d8d4c9] bg-[#fffdf8] px-3 text-[#202321] outline-none transition placeholder:text-[#a8ada5] focus:border-[#48766b] focus:ring-4 focus:ring-[#48766b]/10"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={form.email}
            onChange={(event) => {
              const value = (event.target as HTMLInputElement).value;
              setForm((current) => ({
                ...current,
                email: value,
              }));
            }}
          />
        </label>
        <label className="grid gap-1.5 text-sm">
          <span className="font-medium text-[#202321]">Password</span>
          <div className="flex h-11 items-center gap-2 rounded-lg border border-[#d8d4c9] bg-[#fffdf8] px-3 transition focus-within:border-[#48766b] focus-within:ring-4 focus-within:ring-[#48766b]/10">
            <input
              className="w-full bg-transparent text-[#202321] outline-none placeholder:text-[#a8ada5]"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              placeholder="Minimum 6 characters"
              value={form.password}
              onChange={(event) => {
                const value = (event.target as HTMLInputElement).value;
                setForm((current) => ({
                  ...current,
                  password: value,
                }));
              }}
            />
            <button
              type="button"
              onClick={() => setShowPassword((current) => !current)}
              className="text-xs font-semibold text-[#48766b]"
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>
        </label>
        {formError ? (
          <p className="rounded-lg border border-[#e3b6a7] bg-[#f5e4da] px-3 py-2 text-xs text-[#8f4437]">
            {formError}
          </p>
        ) : null}
        <button
          type="submit"
          disabled={isSubmitting || isGoogleLoading}
          className="inline-flex h-11 w-full items-center justify-center rounded-lg bg-[#202321] px-3 text-sm font-semibold text-[#fffdf8] transition hover:bg-[#2f3531] disabled:cursor-not-allowed disabled:bg-[#a8ada5]"
        >
          {isSubmitting ? "Creating account..." : submitLabel}
        </button>
      </form>
    </div>
  );
}
