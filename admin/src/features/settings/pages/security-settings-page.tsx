import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { PagePanel } from "@/components/page-container";
import { InteractiveLogsTable } from "@/components/uitripled/interactive-logs-table";
import { toast } from "@/components/ui/sonner";
import { ADMIN_ROUTES } from "@/constants/routes";
import { auditApi } from "@/features/audit/api/audit-api";
import { authApi } from "@/features/auth/api/auth-api";
import { useAuthFlow } from "@/features/auth/hooks/use-auth-flow";
import { SecurityMfaPanel } from "@/features/settings/components/security-mfa-panel";
import { SecurityOverview } from "@/features/settings/components/security-overview";
import { SecuritySessionsList } from "@/features/settings/components/security-sessions-list";
import {
  SecurityFeedbackMessages,
  SecuritySessionRemovalDialog,
  SecuritySuspiciousAlerts,
} from "@/features/settings/components/security-feedback";
import { isExpiringSoon } from "@/features/settings/utils/security-session";

export function SecuritySettingsPage() {
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
  const allSessions = useMemo(
    () => sessionsOverview?.sessions ?? [],
    [sessionsOverview?.sessions],
  );
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
      <SecurityOverview
        email={user?.email}
        totalSessions={allSessions.length}
        otherSessions={otherSessions.length}
        riskAlerts={riskAlertCount}
        loadingSessions={sessionsQuery.isLoading}
        loadingRiskAlerts={suspiciousAlertsQuery.isLoading}
        posture={postureTone}
        postureText={postureText}
        sessionPostureHint={
          overLimitCount > 0
            ? `${overLimitCount} session(s) over plan/device policy`
            : "No sessions over policy limits"
        }
        expiringSoonCount={expiringSoonCount}
        mfaEnabled={isMfaEnabled}
        auditFeedLive={hasAuditFeed}
        closingOtherSessions={revokeOthersMutation.isPending}
        signingOut={isSigningOut}
        closeOthersOpen={isCloseOthersOpen}
        signOutOpen={isSignOutOpen}
        onCloseOthersOpenChange={setIsCloseOthersOpen}
        onSignOutOpenChange={setIsSignOutOpen}
        onCloseOtherSessions={() => {
          void revokeOthersMutation.mutateAsync();
        }}
        onSignOut={() => {
          void handleSignOut();
        }}
      />

      <SecurityMfaPanel
        enabled={isMfaEnabled}
        password={mfaPassword}
        code={mfaCode}
        statusMessage={mfaStatusMessage}
        totpUri={totpUri}
        backupCodes={generatedBackupCodes}
        enabling={enableMfaMutation.isPending}
        verifying={verifyMfaMutation.isPending}
        disabling={disableMfaMutation.isPending}
        regeneratingBackupCodes={regenerateBackupCodesMutation.isPending}
        onPasswordChange={setMfaPassword}
        onCodeChange={setMfaCode}
        onEnable={() => {
          setMfaStatusMessage(null);
          void enableMfaMutation.mutateAsync();
        }}
        onVerify={() => {
          setMfaStatusMessage(null);
          void verifyMfaMutation.mutateAsync();
        }}
        onDisable={() => {
          setMfaStatusMessage(null);
          void disableMfaMutation.mutateAsync();
        }}
        onRegenerateBackupCodes={() => {
          setMfaStatusMessage(null);
          void regenerateBackupCodesMutation.mutateAsync();
        }}
      />

      <SecuritySuspiciousAlerts alerts={suspiciousAlerts} />

      <SecurityFeedbackMessages
        sessionError={sessionsQuery.data && !sessionsQuery.data.ok ? sessionsQuery.data.message : null}
        revokeError={
          revokeSessionMutation.data && !revokeSessionMutation.data.ok
            ? revokeSessionMutation.data.message
            : null
        }
        auditUnavailable={Boolean(auditLogsQuery.data && !auditLogsQuery.data.ok)}
        alertsUnavailable={Boolean(
          suspiciousAlertsQuery.data && !suspiciousAlertsQuery.data.ok,
        )}
      />

      <SecuritySessionsList
        sessions={allSessions}
        currentSessionId={currentSessionId}
        loading={sessionsQuery.isLoading}
        removingSessionId={
          revokeSessionMutation.isPending ? revokeSessionMutation.variables : undefined
        }
        onRemove={setSessionToRemove}
      />

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

      <SecuritySessionRemovalDialog
        session={sessionToRemove}
        removing={revokeSessionMutation.isPending}
        onOpenChange={(open) => {
          if (!open) setSessionToRemove(null);
        }}
        onConfirm={() => {
          if (!sessionToRemove) return;
          void revokeSessionMutation.mutateAsync(sessionToRemove.id);
        }}
      />
    </PagePanel>
  );
}

