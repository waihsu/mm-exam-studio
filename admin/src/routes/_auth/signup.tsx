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
    <PagePanel className="w-full max-w-md space-y-5 bg-[#fffdf8]">
      <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[#e7efe9] text-[#48766b]">
        <ShieldCheck className="h-5 w-5" />
      </div>
      <div className="space-y-2">
        <p className="admin-kicker">Access control</p>
        <h2 className="text-2xl font-black text-[#202321]">
          Admin access is invite-only
        </h2>
        <p className="text-sm leading-6 text-[#6e706b]">
          We keep admin accounts tightly controlled. If you need access, contact
          the product owner or current superadmin to assign your role first.
        </p>
      </div>
      <div className="rounded-xl border border-[#e3b6a7] bg-[#f5e4da] px-4 py-3 text-sm text-[#8f4437]">
        <p className="font-semibold text-[#202321]">Access request channel</p>
        <p className="mt-1 inline-flex items-center gap-2">
          <Mail className="h-4 w-4" />
          {supportEmail}
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button asChild className="bg-[#202321] text-[#fffdf8] hover:bg-[#2f3531]">
          <Link to={ADMIN_ROUTES.signIn}>Back to sign in</Link>
        </Button>
      </div>
    </PagePanel>
  );
}
