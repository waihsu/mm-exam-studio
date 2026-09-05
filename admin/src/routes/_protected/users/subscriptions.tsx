import { createFileRoute } from "@tanstack/react-router";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PagePanel } from "@/components/page-container";
import { AdminPageHeader } from "@/components/page-shell";
import { ADMIN_ROUTES } from "@/constants/routes";

export const Route = createFileRoute("/_protected/users/subscriptions")({
  component: OpenAccessAdminPage,
});

function OpenAccessAdminPage() {
  return (
    <div className="space-y-5">
      <AdminPageHeader
        eyebrow="Access model"
        title="Open access"
        description="MM Exam Studio no longer uses subscription tiers, payments, or manual plan approvals."
        actions={
          <Button asChild variant="outline" className="bg-white">
            <a href={ADMIN_ROUTES.users}>Manage users</a>
          </Button>
        }
      />
      <PagePanel className="space-y-4 bg-white/90">
        <Badge className="w-fit border-emerald-200 bg-emerald-50 text-emerald-700">
          Enabled for all accounts
        </Badge>
        <div className="space-y-2">
          <h2 className="text-lg font-black tracking-tight text-slate-950">
            Core tools are available without a paid plan.
          </h2>
          <p className="max-w-2xl text-sm leading-6 text-slate-600">
            Practice, question-paper creation, PDF export, and branding remain available in the
            open-source edition. Existing subscription records are retained only for backward
            compatibility and are not used to restrict access.
          </p>
        </div>
      </PagePanel>
    </div>
  );
}
