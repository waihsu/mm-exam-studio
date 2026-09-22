import { Laptop, LoaderCircle, LogOut, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import type { AuthListedSession } from "@/features/auth/types";
import { formatDeviceLabel, normalizeDeviceText } from "../utils/device";
import { InlineError } from "./profile-shared";

export function ProfileSessionsSection({
  sessions,
  isLoading,
  currentSessionId,
  isRevokingOthers,
  isRevokingOne,
  onRevokeOthers,
  onRevokeSession,
  errorMessages,
}: {
  sessions: AuthListedSession[];
  isLoading: boolean;
  currentSessionId: string | null;
  isRevokingOthers: boolean;
  isRevokingOne: boolean;
  onRevokeOthers: () => Promise<void>;
  onRevokeSession: (sessionId: string) => Promise<void>;
  errorMessages: string[];
}) {
  const otherSessions = sessions.filter((item) => item.id !== currentSessionId);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_18px_45px_-38px_rgba(15,23,42,0.36)] sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
            Active devices
          </p>
          <h3 className="mt-2 text-xl font-semibold text-slate-900">
            Signed-in sessions
          </h3>
        </div>
        {otherSessions.length > 0 ? (
          <Button
            variant="outline"
            className="w-full rounded-xl bg-white sm:w-auto"
            disabled={isRevokingOthers}
            onClick={() => {
              void onRevokeOthers();
            }}
          >
            <LogOut className="h-4 w-4" />
            {isRevokingOthers ? "Closing..." : "Close other devices"}
          </Button>
        ) : null}
      </div>

      {errorMessages.map((message, index) => (
        <InlineError key={`${message}-${index}`} message={message} />
      ))}

      <div className="mt-5 space-y-3">
        {isLoading ? (
          <EmptyState title="Loading active devices..." icon={LoaderCircle} className="py-6" />
        ) : sessions.length ? (
          sessions.map((listedSession) => {
            const isCurrent = listedSession.id === currentSessionId;
            const DeviceIcon = listedSession.bucket === "mobile" ? Smartphone : Laptop;
            const deviceLabel = formatDeviceLabel(listedSession.device, listedSession.bucket);
            const rawDevice = normalizeDeviceText(listedSession.device);
            const shouldShowRawDevice =
              rawDevice.length > 0 && rawDevice.toLowerCase() !== deviceLabel.toLowerCase();

            return (
              <div
                key={listedSession.id}
                className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 transition hover:border-slate-300 hover:bg-white"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex min-w-0 items-start gap-3">
                    <div className="rounded-xl bg-white p-2.5 shadow-sm ring-1 ring-slate-200">
                      <DeviceIcon className="h-4 w-4 text-slate-700" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="break-words font-semibold text-slate-900">
                          {deviceLabel}
                        </p>
                        {isCurrent ? (
                          <span className="rounded-full bg-slate-900 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-white">
                            Current
                          </span>
                        ) : null}
                        {!listedSession.allowed ? (
                          <span className="rounded-full bg-amber-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-amber-700">
                            Over limit
                          </span>
                        ) : null}
                      </div>
                      {shouldShowRawDevice ? (
                        <p className="mt-1 break-words text-xs text-slate-500">
                          {rawDevice}
                        </p>
                      ) : null}
                      <p className="mt-1 text-sm text-slate-500">
                        Signed in{" "}
                        {listedSession.createdAt
                          ? new Date(listedSession.createdAt).toLocaleString("en-US")
                          : "recently"}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        Expires{" "}
                        {listedSession.expiresAt
                          ? new Date(listedSession.expiresAt).toLocaleString("en-US")
                          : "unknown"}
                      </p>
                    </div>
                  </div>
                  {!isCurrent ? (
                    <Button
                      variant="outline"
                      className="w-full rounded-xl bg-white sm:w-auto"
                      disabled={isRevokingOne}
                      onClick={() => {
                        void onRevokeSession(listedSession.id);
                      }}
                    >
                      <LogOut className="h-4 w-4" />
                      Remove
                    </Button>
                  ) : null}
                </div>
              </div>
            );
          })
        ) : (
          <EmptyState
            title="No active sessions found"
            description="Sign in on this device to create a session."
            icon={Laptop}
            className="py-6"
          />
        )}
      </div>
    </div>
  );
}
