import { Laptop, LogOut, Smartphone } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { AuthListedSession } from "@/features/auth/types";
import {
  formatDeviceLabel,
  isExpiringSoon,
  normalizeDeviceText,
  toLocaleDateTime,
} from "../utils/security-session";

type SecuritySessionsListProps = {
  sessions: AuthListedSession[];
  currentSessionId: string | null;
  loading: boolean;
  removingSessionId?: string;
  onRemove: (session: { id: string; label: string }) => void;
};

export function SecuritySessionsList({
  sessions,
  currentSessionId,
  loading,
  removingSessionId,
  onRemove,
}: SecuritySessionsListProps) {
  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-lg font-bold text-slate-900">Trusted Sessions</h3>
        <p className="text-xs text-slate-500">
          Remove unknown devices and keep only approved sign-ins.
        </p>
      </div>

      {loading ? (
        <EmptyState>Loading sessions...</EmptyState>
      ) : sessions.length ? (
        sessions.map((session) => {
          const isCurrent = session.id === currentSessionId;
          const isRemoving = removingSessionId === session.id;
          const DeviceIcon = session.bucket === "mobile" ? Smartphone : Laptop;
          const deviceLabel = formatDeviceLabel(session.device, session.bucket);
          const rawDevice = normalizeDeviceText(session.device);
          const shouldShowRawDevice =
            rawDevice.length > 0 && rawDevice.toLowerCase() !== deviceLabel.toLowerCase();
          const expiringSoon = isExpiringSoon(session.expiresAt);

          return (
            <div
              key={session.id}
              className="rounded-[1.2rem] border border-slate-200 bg-slate-50/80 p-4 transition-colors hover:bg-white"
            >
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div className="flex min-w-0 items-start gap-3">
                  <div className="rounded-xl bg-white p-2 shadow-sm">
                    <DeviceIcon className="h-4 w-4 text-slate-700" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="break-words font-semibold text-slate-900">{deviceLabel}</p>
                      {isCurrent ? <SessionBadge tone="current">Current</SessionBadge> : null}
                      <SessionBadge tone={session.allowed ? "trusted" : "over-limit"}>
                        {session.allowed ? "Trusted" : "Over limit"}
                      </SessionBadge>
                      {expiringSoon ? <SessionBadge tone="expiring">Expires soon</SessionBadge> : null}
                    </div>

                    {shouldShowRawDevice ? (
                      <p className="mt-1 break-words text-xs text-slate-500">{rawDevice}</p>
                    ) : null}

                    <div className="mt-2 grid gap-1 text-xs text-slate-500 sm:grid-cols-3">
                      <p>
                        <span className="font-semibold text-slate-700">Session:</span>{" "}
                        {session.id.slice(0, 10)}...
                      </p>
                      <p>
                        <span className="font-semibold text-slate-700">Signed in:</span>{" "}
                        {toLocaleDateTime(session.createdAt)}
                      </p>
                      <p>
                        <span className="font-semibold text-slate-700">Expires:</span>{" "}
                        {toLocaleDateTime(session.expiresAt)}
                      </p>
                    </div>
                  </div>
                </div>

                {!isCurrent ? (
                  <Button
                    variant="outline"
                    className="w-full bg-white lg:w-auto"
                    disabled={Boolean(removingSessionId)}
                    onClick={() => onRemove({ id: session.id, label: deviceLabel })}
                  >
                    <LogOut className="h-4 w-4" />
                    {isRemoving ? "Removing..." : "Remove"}
                  </Button>
                ) : (
                  <p className="text-xs font-medium text-slate-500">
                    Current session cannot be removed.
                  </p>
                )}
              </div>
            </div>
          );
        })
      ) : (
        <EmptyState>No active sessions found.</EmptyState>
      )}
    </section>
  );
}

function SessionBadge({
  tone,
  children,
}: {
  tone: "current" | "trusted" | "over-limit" | "expiring";
  children: string;
}) {
  const className =
    tone === "current"
      ? "bg-slate-900 text-white"
      : tone === "trusted"
        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
        : "border-amber-200 bg-amber-50 text-amber-700";

  return (
    <Badge
      className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] ${className}`}
    >
      {children}
    </Badge>
  );
}

function EmptyState({ children }: { children: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/70 px-4 py-8 text-sm text-slate-500">
      {children}
    </div>
  );
}
