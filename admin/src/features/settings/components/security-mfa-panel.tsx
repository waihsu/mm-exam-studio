import { KeyRound } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type SecurityMfaPanelProps = {
  enabled: boolean;
  password: string;
  code: string;
  statusMessage: string | null;
  totpUri: string | null;
  backupCodes: string[];
  enabling: boolean;
  verifying: boolean;
  disabling: boolean;
  regeneratingBackupCodes: boolean;
  onPasswordChange: (value: string) => void;
  onCodeChange: (value: string) => void;
  onEnable: () => void;
  onVerify: () => void;
  onDisable: () => void;
  onRegenerateBackupCodes: () => void;
};

export function SecurityMfaPanel({
  enabled,
  password,
  code,
  statusMessage,
  totpUri,
  backupCodes,
  enabling,
  verifying,
  disabling,
  regeneratingBackupCodes,
  onPasswordChange,
  onCodeChange,
  onEnable,
  onVerify,
  onDisable,
  onRegenerateBackupCodes,
}: SecurityMfaPanelProps) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="flex items-center gap-2 text-lg font-bold text-slate-900">
            <KeyRound className="h-5 w-5 text-slate-700" />
            Multi-factor Authentication
          </h3>
          <p className="mt-1 text-sm text-slate-600">
            Protect admin sign-in with authenticator app codes and backup recovery codes.
          </p>
        </div>
        <Badge
          className={cn(
            "rounded-full border px-2.5 py-1 text-[11px] uppercase tracking-[0.16em]",
            enabled
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : "border-amber-200 bg-amber-50 text-amber-700",
          )}
        >
          {enabled ? "Enabled" : "Disabled"}
        </Badge>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="mfa-password">Account password</Label>
            <Input
              id="mfa-password"
              type="password"
              value={password}
              onChange={(event) => onPasswordChange(event.target.value)}
              placeholder="Enter current password"
              autoComplete="current-password"
            />
          </div>

          {!enabled ? (
            <div className="space-y-2">
              <Label htmlFor="mfa-setup-code">Authenticator code</Label>
              <Input
                id="mfa-setup-code"
                value={code}
                onChange={(event) => onCodeChange(event.target.value)}
                placeholder="123456"
                autoComplete="one-time-code"
              />
              <p className="text-xs text-slate-500">
                Step 1: Enable MFA. Step 2: verify with the first code from your app.
              </p>
            </div>
          ) : null}

          <div className="flex flex-wrap gap-2">
            {!enabled ? (
              <Button
                type="button"
                disabled={enabling || password.trim().length < 4}
                onClick={onEnable}
              >
                {enabling ? "Preparing..." : "Enable MFA"}
              </Button>
            ) : (
              <Button
                type="button"
                variant="destructive"
                disabled={disabling || password.trim().length < 4}
                onClick={onDisable}
              >
                {disabling ? "Disabling..." : "Disable MFA"}
              </Button>
            )}
            {!enabled && totpUri ? (
              <Button
                type="button"
                variant="outline"
                disabled={verifying || code.trim().length < 6}
                onClick={onVerify}
              >
                {verifying ? "Verifying..." : "Verify setup"}
              </Button>
            ) : null}
            {enabled ? (
              <Button
                type="button"
                variant="outline"
                disabled={regeneratingBackupCodes || password.trim().length < 4}
                onClick={onRegenerateBackupCodes}
              >
                {regeneratingBackupCodes ? "Generating..." : "Generate backup codes"}
              </Button>
            ) : null}
          </div>

          {statusMessage ? (
            <p className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">
              {statusMessage}
            </p>
          ) : null}
        </div>

        <div className="space-y-3">
          {totpUri ? (
            <div className="rounded-xl border border-slate-200 bg-white p-3">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                QR setup
              </p>
              <img
                src={toQrPreviewUrl(totpUri)}
                alt="Authenticator QR code"
                className="mt-2 h-40 w-40 rounded-lg border border-slate-200 bg-white object-contain"
              />
              <p className="mt-2 break-all text-[11px] text-slate-500">{totpUri}</p>
            </div>
          ) : null}
          {backupCodes.length > 0 ? (
            <div className="rounded-xl border border-slate-200 bg-white p-3">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                Backup codes
              </p>
              <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-slate-700 sm:grid-cols-3">
                {backupCodes.map((backupCode) => (
                  <code
                    key={backupCode}
                    className="rounded bg-slate-100 px-2 py-1 text-[11px] font-semibold text-slate-800"
                  >
                    {backupCode}
                  </code>
                ))}
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-slate-300 bg-white/80 px-3 py-4 text-xs text-slate-500">
              Backup codes will appear here after enabling or regenerating MFA.
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function toQrPreviewUrl(value: string) {
  return `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(value)}`;
}
