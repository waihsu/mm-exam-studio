import { Link } from "@tanstack/react-router";
import { createFileRoute } from "@tanstack/react-router";
import { Mail, ShieldCheck } from "lucide-react";
import { PagePanel } from "@/components/page-container";
import { Button } from "@/components/ui/button";
import { ADMIN_ROUTES } from "@/constants/routes";

const supportEmail =
  import.meta.env.VITE_ADMIN_SUPPORT_EMAIL ?? "admin@study.local";

export const Route = createFileRoute("/_auth/signup")({
  component: SignUpPage,
});

function SignUpPage() {
  return (
    <PagePanel className="w-full max-w-md space-y-5 bg-white/88">
      <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 text-white">
        <ShieldCheck className="h-5 w-5" />
      </div>
      <div className="space-y-2">
        <h2 className="text-2xl font-black text-slate-900">
          Admin access is invite-only
        </h2>
        <p className="text-sm leading-6 text-slate-600">
          We keep admin accounts tightly controlled. If you need access, contact
          the product owner or current superadmin to assign your role first.
        </p>
      </div>
      <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
        <p className="font-semibold">Access request channel</p>
        <p className="mt-1 inline-flex items-center gap-2">
          <Mail className="h-4 w-4" />
          {supportEmail}
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button asChild>
          <Link to={ADMIN_ROUTES.signIn}>Back to sign in</Link>
        </Button>
      </div>
    </PagePanel>
  );
}
