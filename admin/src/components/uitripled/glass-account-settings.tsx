import { Link } from "@tanstack/react-router";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Check, CreditCard, Shield, Users } from "lucide-react";

type GlassAccountSettingsCardProps = {
  planLabel: string;
  planStatus: string;
  activeDevices: number;
  deviceLimit: number;
  otherDevices: number;
  securityPath: string;
  subscriptionsPath: string;
};

const operations = [
  "Session revocation and device hygiene",
  "Role-aware access control review",
  "Subscription request audit coverage",
];

export function GlassAccountSettingsCard({
  planLabel,
  planStatus,
  activeDevices,
  deviceLimit,
  otherDevices,
  securityPath,
  subscriptionsPath,
}: GlassAccountSettingsCardProps) {
  return (
    <section className="group w-full rounded-3xl border border-border/60 bg-card/85 p-8 backdrop-blur-xl sm:p-10">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-white/5 px-3 py-1 text-xs uppercase tracking-[0.28em] text-muted-foreground">
            Account
          </div>
          <h2 className="mt-3 text-2xl font-semibold text-foreground sm:text-3xl">
            Plan and operations overview
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Review admin-plan posture and jump to the controls used in day-to-day operations.
          </p>
        </div>
        <Badge className="rounded-full border border-border/60 bg-white/5 px-4 py-2 text-muted-foreground">
          {planLabel}
        </Badge>
      </div>

      <div className="grid gap-6 lg:grid-cols-[2fr_3fr]">
        <div className="space-y-4">
          <InfoBlock label="Plan status" value={planStatus} />
          <InfoBlock label="Active devices" value={`${activeDevices}/${deviceLimit}`} />
          <InfoBlock label="Other devices" value={String(otherDevices)} />
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl border border-border/60 bg-background/45 p-6">
            <h3 className="text-sm font-medium text-foreground">Operational checklist</h3>
            <div className="mt-4 space-y-3 text-sm text-muted-foreground">
              {operations.map((item) => (
                <p key={item} className="flex items-center gap-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full border border-border/60 bg-primary/10 text-primary">
                    <Check className="h-3 w-3" aria-hidden />
                  </span>
                  {item}
                </p>
              ))}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <Button asChild variant="outline" className="justify-start rounded-2xl border-border/60 bg-white/5 px-4 py-6">
              <Link to={securityPath}>
                <Shield className="mr-2 h-4 w-4" />
                Session controls
              </Link>
            </Button>
            <Button asChild variant="outline" className="justify-start rounded-2xl border-border/60 bg-white/5 px-4 py-6">
              <Link to={subscriptionsPath}>
                <Users className="mr-2 h-4 w-4" />
                Subscription requests
              </Link>
            </Button>
          </div>

          <div className="rounded-2xl border border-border/60 bg-background/45 p-4">
            <p className="inline-flex items-center gap-2 text-sm font-medium text-foreground">
              <CreditCard className="h-4 w-4" />
              Billing integrations remain manual review mode
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Keep transaction proof checks and approval comments consistent for audit readiness.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

function InfoBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border/60 bg-background/45 p-4">
      <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">{label}</p>
      <p className="mt-2 text-sm font-semibold capitalize text-foreground">{value}</p>
    </div>
  );
}
