import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState, type ComponentType } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  KeyRound,
  Laptop,
  LogOut,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Smartphone,
} from "lucide-react";
import { PagePanel } from "@/components/page-container";
import { InteractiveLogsTable } from "@/components/uitripled/interactive-logs-table";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/sonner";
import { ADMIN_ROUTES } from "@/constants/routes";
import { auditApi } from "@/features/audit/api/audit-api";
import { authApi } from "@/features/auth/api/auth-api";
import { useAuthFlow } from "@/features/auth/hooks/use-auth-flow";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_protected/settings/security")({
  component: SettingsSecurityPage,
});

const EXPIRING_SOON_MS = 24 * 60 * 60 * 1000;

const normalizeDeviceText = (value: string | null | undefined) =>
  (value ?? "").replace(/\s+/g, " ").trim();

const detectPlatform = (input: string) => {
  if (!input) return "";
  const value = input.toLowerCase();
  if (value.includes("android")) return "Android";
  if (value.includes("iphone") || value.includes("ipad") || value.includes("ios")) return "iOS";
  if (value.includes("windows")) return "Windows";
  if (value.includes("mac os") || value.includes("macintosh")) return "macOS";
  if (value.includes("linux")) return "Linux";
  return "";
};

const detectBrowser = (input: string) => {
  if (!input) return "";
  const value = input.toLowerCase();
  if (value.includes("edg/")) return "Edge";
  if (value.includes("chrome/") && !value.includes("edg/")) return "Chrome";
  if (value.includes("firefox/")) return "Firefox";
  if (value.includes("safari/") && !value.includes("chrome/")) return "Safari";
  if (value.includes("opera/") || value.includes("opr/")) return "Opera";
  return "";
};

const formatDeviceLabel = (rawDevice: string | null | undefined, bucket?: string) => {
  const normalized = normalizeDeviceText(rawDevice);
  if (!normalized) return bucket === "mobile" ? "Mobile device" : "Desktop device";

  const platform = detectPlatform(normalized);
  const browser = detectBrowser(normalized);
  const looksLikeUserAgent = normalized.includes("/") || normalized.includes("mozilla");
  const labelParts = [platform, browser].filter(Boolean);

  if (labelParts.length > 0) return labelParts.join(" · ");
  if (looksLikeUserAgent && bucket === "mobile") return "Mobile browser";
  if (looksLikeUserAgent) return "Desktop browser";
  return normalized;
};

const isExpiringSoon = (expiresAt: string | null | undefined) => {
  if (!expiresAt) return false;
  const expiresAtMs = new Date(expiresAt).getTime();
  if (Number.isNaN(expiresAtMs)) return false;
  const remainingMs = expiresAtMs - Date.now();
  return remainingMs > 0 && remainingMs <= EXPIRING_SOON_MS;
};

const toLocaleDateTime = (value: string | null | undefined) => {
  if (!value) return "Unknown";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString("en-US");
};

const toQrPreviewUrl = (value: string) =>
  `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(value)}`;

function SettingsSecurityPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, signOut, revokeOtherSessions } = useAuthFlow();
  const [isCloseOthersOpen, setIsCloseOthersOpen] = useState(false);
  const [isSignOutOpen, setIsSignOutOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [sessionToRemove, setSessionToRemove] = useState<{
    id: string;
    label: string;
  } | null>(null);
  const [mfaPassword, setMfaPassword] = useState("");
  const [mfaCode, setMfaCode] = useState("");
  const [mfaStatusMessage, setMfaStatusMessage] = useState<string | null>(null);
  const [generatedBackupCodes, setGeneratedBackupCodes] = useState<string[]>([]);
  const [totpUri, setTotpUri] = useState<string | null>(null);
  const [mfaEnabledOverride, setMfaEnabledOverride] = useState<boolean | null>(null);

  const sessionsQuery = useQuery({
    queryKey: ["admin-auth-sessions"],
    queryFn: () => authApi.listSessions(),
  });
  const auditLogsQuery = useQuery({
    queryKey: ["admin-audit-logs", "security"],
    queryFn: () =>
      auditApi.listAuditLogs({
        actionPrefix: "auth.",
        page: 1,
        pageSize: 500,
      }),
  });
  const suspiciousAlertsQuery = useQuery({
    queryKey: ["admin-audit-alerts", "security"],
    queryFn: () =>
      auditApi.listSuspiciousSignInAlerts({
        limit: 8,
        minRiskScore: 60,
      }),
  });

  const revokeOthersMutation = useMutation({
    mutationFn: () => revokeOtherSessions(),
    onSuccess: async (ok) => {
      if (!ok) return;
      setIsCloseOthersOpen(false);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["admin-auth-sessions"] }),
        queryClient.invalidateQueries({ queryKey: ["admin-audit-logs", "security"] }),
        queryClient.invalidateQueries({ queryKey: ["admin-audit-alerts", "security"] }),
      ]);
    },
  });

  const revokeSessionMutation = useMutation({
    mutationFn: (sessionId: string) => authApi.revokeSession(sessionId),
    onSuccess: async (response) => {
      if (!response.ok) {
        toast.error(response.message ?? "Failed to remove session");
        return;
      }
      toast.success("Session removed");
      setSessionToRemove(null);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["admin-auth-sessions"] }),
        queryClient.invalidateQueries({ queryKey: ["admin-audit-logs", "security"] }),
        queryClient.invalidateQueries({ queryKey: ["admin-audit-alerts", "security"] }),
      ]);
    },
    onError: () => {
      toast.error("Failed to remove session");
    },
  });
  const enableMfaMutation = useMutation({
    mutationFn: () =>
      authApi.enableTwoFactor({
        password: mfaPassword,
      }),
    onSuccess: (result) => {
      if (!result.ok) {
        setMfaStatusMessage(result.message);
        return;
      }
      setTotpUri(result.totpURI);
      setGeneratedBackupCodes(result.backupCodes);
      setMfaStatusMessage("Scan QR URI in authenticator app, then verify the first code below.");
      setMfaCode("");
    },
  });
  const verifyMfaMutation = useMutation({
    mutationFn: () =>
      authApi.verifyTwoFactor({
        code: mfaCode,
        method: "totp",
        trustDevice: true,
      }),
    onSuccess: async (result) => {
      if (!result.ok) {
        setMfaStatusMessage(result.message);
        return;
      }
      setMfaEnabledOverride(true);
      setMfaStatusMessage("Two-factor authentication is now enabled.");
      setMfaCode("");
      await queryClient.invalidateQueries({ queryKey: ["admin-audit-logs", "security"] });
    },
  });
  const disableMfaMutation = useMutation({
    mutationFn: () =>
      authApi.disableTwoFactor({
        password: mfaPassword,
      }),
    onSuccess: async (result) => {
      if (!result.ok) {
        setMfaStatusMessage(result.message);
        return;
      }
      setGeneratedBackupCodes([]);
      setTotpUri(null);
      setMfaEnabledOverride(false);
      setMfaStatusMessage("Two-factor authentication disabled.");
      setMfaPassword("");
      await queryClient.invalidateQueries({ queryKey: ["admin-audit-logs", "security"] });
    },
  });
  const regenerateBackupCodesMutation = useMutation({
    mutationFn: () =>
      authApi.regenerateBackupCodes({
        password: mfaPassword,
      }),
    onSuccess: (result) => {
      if (!result.ok) {
        setMfaStatusMessage(result.message);
        return;
      }
      setGeneratedBackupCodes(result.backupCodes);
      setMfaStatusMessage("Generated new backup codes. Store them securely.");
    },
  });

  const sessionsOverview = sessionsQuery.data?.ok ? sessionsQuery.data.data : null;
  const currentSessionId = sessionsOverview?.currentSessionId ?? null;
  const allSessions = sessionsOverview?.sessions ?? [];
  const otherSessions = allSessions.filter((item) => item.id !== currentSessionId);
  const overLimitCount = allSessions.filter((session) => !session.allowed).length;
  const expiringSoonCount = allSessions.filter((session) => isExpiringSoon(session.expiresAt)).length;
  const riskAlertCount =
    suspiciousAlertsQuery.data?.ok ? suspiciousAlertsQuery.data.data.total : 0;
  const suspiciousAlerts =
    suspiciousAlertsQuery.data?.ok ? suspiciousAlertsQuery.data.data.rows : [];
  const isMfaEnabled =
    mfaEnabledOverride ?? (user?.twoFactorEnabled === true);

  const sessionLogRows = useMemo(() => {
    return allSessions.map((item) => ({
      id: item.id,
      action:
        item.id === currentSessionId
          ? "session.current"
          : item.allowed
            ? "session.active"
            : "session.over_limit",
      entityType: "auth_session",
      entityId: item.id,
      actor: user?.email || "unknown-admin",
      createdAt: item.createdAt || item.expiresAt || new Date().toISOString(),
      metadata: {
        bucket: item.bucket,
        device: item.device,
        allowed: item.allowed,
        expiresAt: item.expiresAt,
      },
    }));
  }, [allSessions, currentSessionId, user?.email]);

  const auditLogRows = useMemo(() => {
    if (!auditLogsQuery.data?.ok) return [];
    return auditLogsQuery.data.data.rows.map((row) => ({
      id: `audit-${row.id}`,
      action: row.action,
      entityType: row.entityType || "audit_log",
      entityId: row.entityId || row.id,
      actor: row.actorEmail || row.actorName || row.actorUserId || "system",
      createdAt: row.createdAt,
      metadata: {
        ...(row.metadata ?? {}),
        ipAddress: row.ipAddress,
        userAgent: row.userAgent,
      },
    }));
  }, [auditLogsQuery.data]);

  const logRows = auditLogRows.length > 0 ? auditLogRows : sessionLogRows;
  const hasAuditFeed = auditLogRows.length > 0;
  const postureTone =
    overLimitCount > 0 || riskAlertCount > 0
      ? "critical"
      : expiringSoonCount > 0
        ? "warning"
        : "healthy";
  const postureText =
    postureTone === "critical"
      ? "Action needed"
      : postureTone === "warning"
        ? "Needs review"
        : "Healthy";

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      const ok = await signOut();
      if (!ok) return;
      setIsSignOutOpen(false);
      await navigate({ to: ADMIN_ROUTES.signIn });
    } finally {
      setIsSigningOut(false);
    }
  };

  return (
    <PagePanel className="space-y-5 bg-white/88">
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
          <Badge
            className={cn(
              "rounded-full border px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.14em]",
              postureTone === "critical"
                ? "border-rose-200 bg-rose-50 text-rose-700"
                : postureTone === "warning"
                  ? "border-amber-200 bg-amber-50 text-amber-700"
                  : "border-emerald-200 bg-emerald-50 text-emerald-700",
            )}
          >
            {postureText}
          </Badge>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <SummaryCard label="Signed in as" value={user?.email || "Unknown"} />
          <SummaryCard
            label="Total sessions"
            value={sessionsQuery.isLoading ? "..." : String(allSessions.length)}
          />
          <SummaryCard
            label="Other devices"
            value={sessionsQuery.isLoading ? "..." : String(otherSessions.length)}
          />
          <SummaryCard
            label="Risk alerts"
            value={suspiciousAlertsQuery.isLoading ? "..." : String(riskAlertCount)}
          />
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <AlertDialog open={isCloseOthersOpen} onOpenChange={setIsCloseOthersOpen}>
            <AlertDialogTrigger asChild>
              <Button
                variant="outline"
                className="bg-white"
                disabled={revokeOthersMutation.isPending || otherSessions.length < 1}
              >
                <LogOut className="h-4 w-4" />
                {revokeOthersMutation.isPending ? "Closing..." : "Close Other Sessions"}
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
                  <Button
                    variant="destructive"
                    disabled={revokeOthersMutation.isPending}
                    onClick={() => {
                      void revokeOthersMutation.mutateAsync();
                    }}
                  >
                    {revokeOthersMutation.isPending ? "Closing..." : "Close sessions"}
                  </Button>
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <AlertDialog open={isSignOutOpen} onOpenChange={setIsSignOutOpen}>
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
                  You will return to the admin sign-in page and this session token will be
                  invalidated.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel asChild>
                  <Button variant="outline">Cancel</Button>
                </AlertDialogCancel>
                <AlertDialogAction asChild>
                  <Button onClick={() => void handleSignOut()} disabled={isSigningOut}>
                    {isSigningOut ? "Signing out..." : "Sign out now"}
                  </Button>
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <Badge
            variant="outline"
            className={cn(
              "rounded-full border px-3 py-1.5 text-xs",
              hasAuditFeed
                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                : "border-amber-200 bg-amber-50 text-amber-800",
            )}
          >
            {hasAuditFeed ? "Audit feed live" : "Audit fallback active"}
          </Badge>
        </div>
      </section>

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        <SecuritySignalCard
          title="Session posture"
          value={postureText}
          hint={
            overLimitCount > 0
              ? `${overLimitCount} session(s) over plan/device policy`
              : "No sessions over policy limits"
          }
          icon={postureTone === "critical" ? ShieldAlert : ShieldCheck}
          tone={postureTone === "critical" ? "critical" : postureTone === "warning" ? "warning" : "healthy"}
        />
        <SecuritySignalCard
          title="Sign-in expiry watch"
          value={sessionsQuery.isLoading ? "Checking..." : `${expiringSoonCount} expiring soon`}
          hint="Sessions expiring in the next 24 hours"
          icon={Clock3}
          tone={expiringSoonCount > 0 ? "warning" : "healthy"}
        />
        <SecuritySignalCard
          title="MFA readiness"
          value={isMfaEnabled ? "Enabled" : "Not configured"}
          hint={
            isMfaEnabled
              ? "Authenticator + backup code verification is active"
              : "Enable TOTP and backup codes for stronger sign-in security"
          }
          icon={isMfaEnabled ? ShieldCheck : AlertTriangle}
          tone={isMfaEnabled ? "healthy" : "warning"}
        />
      </section>

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
              isMfaEnabled
                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                : "border-amber-200 bg-amber-50 text-amber-700",
            )}
          >
            {isMfaEnabled ? "Enabled" : "Disabled"}
          </Badge>
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="mfa-password">Account password</Label>
              <Input
                id="mfa-password"
                type="password"
                value={mfaPassword}
                onChange={(event) => setMfaPassword(event.target.value)}
                placeholder="Enter current password"
                autoComplete="current-password"
              />
            </div>

            {!isMfaEnabled ? (
              <div className="space-y-2">
                <Label htmlFor="mfa-setup-code">Authenticator code</Label>
                <Input
                  id="mfa-setup-code"
                  value={mfaCode}
                  onChange={(event) => setMfaCode(event.target.value)}
                  placeholder="123456"
                  autoComplete="one-time-code"
                />
                <p className="text-xs text-slate-500">
                  Step 1: Enable MFA. Step 2: verify with the first code from your app.
                </p>
              </div>
            ) : null}

            <div className="flex flex-wrap gap-2">
              {!isMfaEnabled ? (
                <Button
                  type="button"
                  disabled={enableMfaMutation.isPending || mfaPassword.trim().length < 4}
                  onClick={() => {
                    setMfaStatusMessage(null);
                    void enableMfaMutation.mutateAsync();
                  }}
                >
                  {enableMfaMutation.isPending ? "Preparing..." : "Enable MFA"}
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="destructive"
                  disabled={disableMfaMutation.isPending || mfaPassword.trim().length < 4}
                  onClick={() => {
                    setMfaStatusMessage(null);
                    void disableMfaMutation.mutateAsync();
                  }}
                >
                  {disableMfaMutation.isPending ? "Disabling..." : "Disable MFA"}
                </Button>
              )}
              {!isMfaEnabled && totpUri ? (
                <Button
                  type="button"
                  variant="outline"
                  disabled={verifyMfaMutation.isPending || mfaCode.trim().length < 6}
                  onClick={() => {
                    setMfaStatusMessage(null);
                    void verifyMfaMutation.mutateAsync();
                  }}
                >
                  {verifyMfaMutation.isPending ? "Verifying..." : "Verify setup"}
                </Button>
              ) : null}
              {isMfaEnabled ? (
                <Button
                  type="button"
                  variant="outline"
                  disabled={regenerateBackupCodesMutation.isPending || mfaPassword.trim().length < 4}
                  onClick={() => {
                    setMfaStatusMessage(null);
                    void regenerateBackupCodesMutation.mutateAsync();
                  }}
                >
                  {regenerateBackupCodesMutation.isPending
                    ? "Generating..."
                    : "Generate backup codes"}
                </Button>
              ) : null}
            </div>

            {mfaStatusMessage ? (
              <p className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">
                {mfaStatusMessage}
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
            {generatedBackupCodes.length > 0 ? (
              <div className="rounded-xl border border-slate-200 bg-white p-3">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                  Backup codes
                </p>
                <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-slate-700 sm:grid-cols-3">
                  {generatedBackupCodes.map((code) => (
                    <code
                      key={code}
                      className="rounded bg-slate-100 px-2 py-1 text-[11px] font-semibold text-slate-800"
                    >
                      {code}
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

      {suspiciousAlerts.length > 0 ? (
        <section className="rounded-2xl border border-rose-200 bg-rose-50/70 p-4">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-sm font-bold text-rose-800">Suspicious Sign-in Alerts</h3>
            <Badge className="rounded-full border-rose-300 bg-rose-100 text-rose-700">
              {suspiciousAlerts.length}
            </Badge>
          </div>
          <div className="mt-3 space-y-2">
            {suspiciousAlerts.slice(0, 5).map((alert) => (
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
      ) : null}

      {sessionsQuery.data && !sessionsQuery.data.ok ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {sessionsQuery.data.message}
        </div>
      ) : null}
      {revokeSessionMutation.data && !revokeSessionMutation.data.ok ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {revokeSessionMutation.data.message}
        </div>
      ) : null}
      {auditLogsQuery.data && !auditLogsQuery.data.ok ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Audit logs API unavailable, showing fallback session feed only.
        </div>
      ) : null}
      {suspiciousAlertsQuery.data && !suspiciousAlertsQuery.data.ok ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Suspicious alert feed is unavailable right now.
        </div>
      ) : null}

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-lg font-bold text-slate-900">Trusted Sessions</h3>
          <p className="text-xs text-slate-500">
            Remove unknown devices and keep only approved sign-ins.
          </p>
        </div>

        {sessionsQuery.isLoading ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/70 px-4 py-8 text-sm text-slate-500">
            Loading sessions...
          </div>
        ) : allSessions.length ? (
          allSessions.map((session) => {
            const isCurrent = session.id === currentSessionId;
            const isRemovingCurrentRow =
              revokeSessionMutation.isPending && revokeSessionMutation.variables === session.id;
            const DeviceIcon = session.bucket === "mobile" ? Smartphone : Laptop;
            const deviceLabel = formatDeviceLabel(session.device, session.bucket);
            const rawDevice = normalizeDeviceText(session.device);
            const shouldShowRawDevice =
              rawDevice.length > 0 && rawDevice.toLowerCase() !== deviceLabel.toLowerCase();
            const isExpiringSoonRow = isExpiringSoon(session.expiresAt);

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
                        {isCurrent ? (
                          <Badge className="rounded-full bg-slate-900 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-white">
                            Current
                          </Badge>
                        ) : null}
                        {!session.allowed ? (
                          <Badge className="rounded-full border-amber-200 bg-amber-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-amber-700">
                            Over limit
                          </Badge>
                        ) : (
                          <Badge className="rounded-full border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-700">
                            Trusted
                          </Badge>
                        )}
                        {isExpiringSoonRow ? (
                          <Badge className="rounded-full border-amber-200 bg-amber-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-amber-700">
                            Expires soon
                          </Badge>
                        ) : null}
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
                      disabled={revokeSessionMutation.isPending}
                      onClick={() => {
                        setSessionToRemove({
                          id: session.id,
                          label: deviceLabel,
                        });
                      }}
                    >
                      <LogOut className="h-4 w-4" />
                      {isRemovingCurrentRow ? "Removing..." : "Remove"}
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
          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/70 px-4 py-8 text-sm text-slate-500">
            No active sessions found.
          </div>
        )}
      </section>

      <InteractiveLogsTable
        rows={logRows}
        title="Session Activity Feed"
        description="Live audit logs for auth actions with fallback to current session inventory."
        isRefreshing={
          sessionsQuery.isFetching ||
          auditLogsQuery.isFetching ||
          suspiciousAlertsQuery.isFetching
        }
        onRefresh={() => {
          void sessionsQuery.refetch();
          void auditLogsQuery.refetch();
          void suspiciousAlertsQuery.refetch();
        }}
      />

      <AlertDialog
        open={Boolean(sessionToRemove)}
        onOpenChange={(open) => {
          if (!open) setSessionToRemove(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove this session?</AlertDialogTitle>
            <AlertDialogDescription>
              {sessionToRemove
                ? `This will sign out ${sessionToRemove.label} immediately.`
                : "This will sign out the selected session immediately."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel asChild>
              <Button variant="outline">Cancel</Button>
            </AlertDialogCancel>
            <AlertDialogAction asChild>
              <Button
                variant="destructive"
                disabled={revokeSessionMutation.isPending || !sessionToRemove}
                onClick={() => {
                  if (!sessionToRemove) return;
                  void revokeSessionMutation.mutateAsync(sessionToRemove.id);
                }}
              >
                {revokeSessionMutation.isPending ? "Removing..." : "Remove session"}
              </Button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PagePanel>
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
  tone: "healthy" | "warning" | "critical";
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border px-4 py-3",
        tone === "healthy"
          ? "border-emerald-200 bg-emerald-50/70"
          : tone === "warning"
            ? "border-amber-200 bg-amber-50/70"
            : "border-rose-200 bg-rose-50/70",
      )}
    >
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
