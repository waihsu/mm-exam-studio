import type { ComponentType } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  LogOut,
  Shield,
  ShieldAlert,
  ShieldCheck,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type SecurityPosture = "healthy" | "warning" | "critical";

type SecurityOverviewProps = {
  email: string | null | undefined;
  totalSessions: number;
  otherSessions: number;
  riskAlerts: number;
  loadingSessions: boolean;
  loadingRiskAlerts: boolean;
  posture: SecurityPosture;
  postureText: string;
  sessionPostureHint: string;
  expiringSoonCount: number;
  mfaEnabled: boolean;
  auditFeedLive: boolean;
  closingOtherSessions: boolean;
  signingOut: boolean;
  closeOthersOpen: boolean;
  signOutOpen: boolean;
  onCloseOthersOpenChange: (open: boolean) => void;
  onSignOutOpenChange: (open: boolean) => void;
  onCloseOtherSessions: () => void;
  onSignOut: () => void;
};

export function SecurityOverview({
  email,
  totalSessions,
  otherSessions,
  riskAlerts,
  loadingSessions,
  loadingRiskAlerts,
  posture,
  postureText,
  sessionPostureHint,
  expiringSoonCount,
  mfaEnabled,
  auditFeedLive,
  closingOtherSessions,
  signingOut,
  closeOthersOpen,
  signOutOpen,
  onCloseOthersOpenChange,
  onSignOutOpenChange,
  onCloseOtherSessions,
  onSignOut,
}: SecurityOverviewProps) {
  return (
    <>
      <section className="rounded-3xl border border-slate-200 bg-[linear-gradient(120deg,rgba(15,23,42,0.03)_0%,rgba(14,116,144,0.06)_100%)] p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-900 text-white">
              <Shield className="h-5 w-5" />
            </div>
            <h2 className="text-2xl font-black text-slate-900">Security Controls</h2>
            <p className="max-w-2xl text-sm leading-7 text-slate-600">
              Manage trusted sessions, remove stale access, and keep sign-in activity observable
              for this admin account.
            </p>
          </div>
          <Badge className={postureBadgeClass(posture)}>{postureText}</Badge>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <SummaryCard label="Signed in as" value={email || "Unknown"} />
          <SummaryCard label="Total sessions" value={loadingSessions ? "..." : String(totalSessions)} />
          <SummaryCard label="Other devices" value={loadingSessions ? "..." : String(otherSessions)} />
          <SummaryCard label="Risk alerts" value={loadingRiskAlerts ? "..." : String(riskAlerts)} />
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <AlertDialog open={closeOthersOpen} onOpenChange={onCloseOthersOpenChange}>
            <AlertDialogTrigger asChild>
              <Button
                variant="outline"
                className="bg-white"
                disabled={closingOtherSessions || otherSessions < 1}
              >
                <LogOut className="h-4 w-4" />
                {closingOtherSessions ? "Closing..." : "Close Other Sessions"}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Close all other sessions?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will sign out all other devices except your current one.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel asChild>
                  <Button variant="outline">Cancel</Button>
                </AlertDialogCancel>
                <AlertDialogAction asChild>
                  <Button variant="destructive" disabled={closingOtherSessions} onClick={onCloseOtherSessions}>
                    {closingOtherSessions ? "Closing..." : "Close sessions"}
                  </Button>
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <AlertDialog open={signOutOpen} onOpenChange={onSignOutOpenChange}>
            <AlertDialogTrigger asChild>
              <Button>
                <LogOut className="h-4 w-4" />
                Sign Out
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Sign out this device?</AlertDialogTitle>
                <AlertDialogDescription>
                  You will return to the admin sign-in page and this session token will be invalidated.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel asChild>
                  <Button variant="outline">Cancel</Button>
                </AlertDialogCancel>
                <AlertDialogAction asChild>
                  <Button onClick={onSignOut} disabled={signingOut}>
                    {signingOut ? "Signing out..." : "Sign out now"}
                  </Button>
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <Badge
            variant="outline"
            className={cn(
              "rounded-full border px-3 py-1.5 text-xs",
              auditFeedLive
                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                : "border-amber-200 bg-amber-50 text-amber-800",
            )}
          >
            {auditFeedLive ? "Audit feed live" : "Audit fallback active"}
          </Badge>
        </div>
      </section>

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        <SecuritySignalCard
          title="Session posture"
          value={postureText}
          hint={sessionPostureHint}
          icon={posture === "critical" ? ShieldAlert : ShieldCheck}
          tone={posture}
        />
        <SecuritySignalCard
          title="Sign-in expiry watch"
          value={loadingSessions ? "Checking..." : `${expiringSoonCount} expiring soon`}
          hint="Sessions expiring in the next 24 hours"
          icon={Clock3}
          tone={expiringSoonCount > 0 ? "warning" : "healthy"}
        />
        <SecuritySignalCard
          title="MFA readiness"
          value={mfaEnabled ? "Enabled" : "Not configured"}
          hint={
            mfaEnabled
              ? "Authenticator + backup code verification is active"
              : "Enable TOTP and backup codes for stronger sign-in security"
          }
          icon={mfaEnabled ? ShieldCheck : AlertTriangle}
          tone={mfaEnabled ? "healthy" : "warning"}
        />
      </section>
    </>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white/85 px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">{label}</p>
      <p className="mt-2 break-words text-sm font-semibold text-slate-900">{value}</p>
    </div>
  );
}

function SecuritySignalCard({
  title,
  value,
  hint,
  icon: Icon,
  tone,
}: {
  title: string;
  value: string;
  hint: string;
  icon: ComponentType<{ className?: string }>;
  tone: SecurityPosture;
}) {
  return (
    <div className={signalClass(tone)}>
      <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-600">
        <Icon className="h-4 w-4" />
        {title}
      </p>
      <p className="mt-2 text-sm font-semibold text-slate-900">{value}</p>
      <p className="mt-1 text-xs text-slate-600">{hint}</p>
      {tone === "healthy" ? (
        <CheckCircle2 className="mt-2 h-4 w-4 text-emerald-600" />
      ) : tone === "critical" ? (
        <ShieldAlert className="mt-2 h-4 w-4 text-rose-600" />
      ) : (
        <AlertTriangle className="mt-2 h-4 w-4 text-amber-600" />
      )}
    </div>
  );
}

function postureBadgeClass(posture: SecurityPosture) {
  return cn(
    "rounded-full border px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.14em]",
    posture === "critical"
      ? "border-rose-200 bg-rose-50 text-rose-700"
      : posture === "warning"
        ? "border-amber-200 bg-amber-50 text-amber-700"
        : "border-emerald-200 bg-emerald-50 text-emerald-700",
  );
}

function signalClass(tone: SecurityPosture) {
  return cn(
    "rounded-2xl border px-4 py-3",
    tone === "healthy"
      ? "border-emerald-200 bg-emerald-50/70"
      : tone === "warning"
        ? "border-amber-200 bg-amber-50/70"
        : "border-rose-200 bg-rose-50/70",
  );
}
