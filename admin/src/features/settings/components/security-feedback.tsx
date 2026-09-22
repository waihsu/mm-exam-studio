import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { SuspiciousSignInAlert } from "@/features/audit/types";
import { toLocaleDateTime } from "../utils/security-session";

export function SecuritySuspiciousAlerts({ alerts }: { alerts: SuspiciousSignInAlert[] }) {
  if (!alerts.length) return null;

  return (
    <section className="rounded-2xl border border-rose-200 bg-rose-50/70 p-4">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-bold text-rose-800">Suspicious Sign-in Alerts</h3>
        <Badge className="rounded-full border-rose-300 bg-rose-100 text-rose-700">
          {alerts.length}
        </Badge>
      </div>
      <div className="mt-3 space-y-2">
        {alerts.slice(0, 5).map((alert) => (
          <div
            key={alert.id}
            className="rounded-xl border border-rose-200 bg-white px-3 py-2 text-xs text-slate-700"
          >
            <p className="font-semibold text-slate-900">
              {alert.action} · risk {alert.riskScore} ({alert.riskLevel})
            </p>
            <p className="mt-1">
              {alert.actorEmail || "unknown"} · {alert.ipAddress || "unknown IP"} ·{" "}
              {toLocaleDateTime(alert.createdAt)}
            </p>
            {alert.reasons.length > 0 ? (
              <p className="mt-1 text-rose-700">{alert.reasons.join(", ")}</p>
            ) : null}
          </div>
        ))}
      </div>
    </section>
  );
}

export function SecurityFeedbackMessages({
  sessionError,
  revokeError,
  auditUnavailable,
  alertsUnavailable,
}: {
  sessionError?: string | null;
  revokeError?: string | null;
  auditUnavailable: boolean;
  alertsUnavailable: boolean;
}) {
  return (
    <>
      {sessionError ? <ErrorMessage tone="error">{sessionError}</ErrorMessage> : null}
      {revokeError ? <ErrorMessage tone="error">{revokeError}</ErrorMessage> : null}
      {auditUnavailable ? (
        <ErrorMessage tone="warning">
          Audit logs API unavailable, showing fallback session feed only.
        </ErrorMessage>
      ) : null}
      {alertsUnavailable ? (
        <ErrorMessage tone="warning">Suspicious alert feed is unavailable right now.</ErrorMessage>
      ) : null}
    </>
  );
}

export function SecuritySessionRemovalDialog({
  session,
  removing,
  onOpenChange,
  onConfirm,
}: {
  session: { id: string; label: string } | null;
  removing: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}) {
  return (
    <AlertDialog open={Boolean(session)} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Remove this session?</AlertDialogTitle>
          <AlertDialogDescription>
            {session
              ? `This will sign out ${session.label} immediately.`
              : "This will sign out the selected session immediately."}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel asChild>
            <Button variant="outline">Cancel</Button>
          </AlertDialogCancel>
          <AlertDialogAction asChild>
            <Button variant="destructive" disabled={removing || !session} onClick={onConfirm}>
              {removing ? "Removing..." : "Remove session"}
            </Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function ErrorMessage({
  tone,
  children,
}: {
  tone: "error" | "warning";
  children: string;
}) {
  return (
    <div
      className={
        tone === "error"
          ? "rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          : "rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800"
      }
    >
      {children}
    </div>
  );
}
