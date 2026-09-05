import {
  BadgeCheck,
  CreditCard,
  LifeBuoy,
  MessageSquareMore,
  MonitorSmartphone,
  UserCog,
  UsersRound,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { AccountStatus, AdminUserDirectoryRow } from "../types";
import { canManageAdminUserRole, getNextAdminUserRole } from "../utils/user-role";

type UserDirectoryTableProps = {
  rows: AdminUserDirectoryRow[];
  isSuperAdmin: boolean;
  actorUserId?: string;
  updatingRole: boolean;
  onOpenSubscription: (row: AdminUserDirectoryRow) => void;
  onOpenSupport: (row: AdminUserDirectoryRow) => void;
  onOpenDevices: (row: AdminUserDirectoryRow) => void;
  onChangeRole: (input: { userId: string; role: "user" | "admin" }) => void;
};

export function UserDirectoryTable({
  rows,
  isSuperAdmin,
  actorUserId,
  updatingRole,
  onOpenSubscription,
  onOpenSupport,
  onOpenDevices,
  onChangeRole,
}: UserDirectoryTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>User</TableHead>
          <TableHead>Access</TableHead>
          <TableHead>Subscription</TableHead>
          <TableHead>Support</TableHead>
          <TableHead>Activity</TableHead>
          <TableHead className="w-[220px]">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.length ? (
          rows.map((row) => {
            const canChangeRole = canManageAdminUserRole({
              isSuperAdmin,
              actorUserId,
              targetUserId: row.user.id,
              targetRole: row.user.role,
            });
            const roleTitle = !isSuperAdmin
              ? "Only super admins can change roles."
              : row.user.role === "superadmin"
                ? "Seeded superadmin accounts are protected here."
                : actorUserId === row.user.id
                  ? "You cannot change your own role here."
                  : undefined;

            return (
              <TableRow key={row.user.id}>
                <TableCell className="whitespace-normal">
                  <div className="space-y-1">
                    <p className="font-semibold text-slate-900">{row.user.name}</p>
                    <p className="text-sm text-slate-600">{row.user.email}</p>
                    <p className="text-xs text-slate-400">{row.user.id}</p>
                  </div>
                </TableCell>
                <TableCell className="whitespace-normal">
                  <div className="space-y-2">
                    <div className="flex flex-wrap gap-2">
                      <Badge className={roleTone(row.user.role)}>{row.user.role}</Badge>
                      <Badge className={accountTone(row.user.accountStatus)}>
                        {row.user.accountStatus}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap gap-2 text-xs">
                      <Badge className={row.user.emailVerified ? verifiedTone : neutralTone}>
                        {row.user.emailVerified ? "email verified" : "email unverified"}
                      </Badge>
                      <Badge className={row.user.twoFactorEnabled ? mfaTone : neutralTone}>
                        {row.user.twoFactorEnabled ? "2FA on" : "2FA off"}
                      </Badge>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="whitespace-normal">
                  {row.subscription ? (
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge className={neutralTone}>{row.subscription.planCode}</Badge>
                        <Badge className={subscriptionTone(row.subscription.status)}>
                          {row.subscription.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-slate-700">
                        {row.subscription.planName} • {row.subscription.billingCycle}
                      </p>
                      <p className="text-xs text-slate-500">
                        Devices {row.subscription.activeDeviceCount} • Ends {formatDate(row.subscription.endsAt)}
                      </p>
                    </div>
                  ) : (
                    <EmptyCell
                      title="No subscription snapshot"
                      detail="This account has not been assigned a plan row yet."
                    />
                  )}
                </TableCell>
                <TableCell className="whitespace-normal">
                  {row.support ? (
                    <div className="space-y-2">
                      <div className="flex flex-wrap gap-2">
                        <Badge className={supportTone(row)}>
                          {row.support.unreadForAdminCount > 0
                            ? `${row.support.unreadForAdminCount} waiting`
                            : row.support.status}
                        </Badge>
                        <Badge className={row.support.allowUserReplies ? mfaTone : suspendedTone}>
                          {row.support.allowUserReplies ? "replies on" : "replies off"}
                        </Badge>
                      </div>
                      <p className="text-sm text-slate-700">
                        {row.support.lastMessagePreview ?? "No message preview yet"}
                      </p>
                      <p className="text-xs text-slate-500">
                        Last support activity {row.support.lastMessageAt ? formatDateTime(row.support.lastMessageAt) : "not started"}
                      </p>
                    </div>
                  ) : (
                    <EmptyCell
                      title="No support thread"
                      detail="A thread appears after the user opens support once."
                    />
                  )}
                </TableCell>
                <TableCell className="whitespace-normal">
                  <div className="space-y-2 text-sm text-slate-600">
                    <ActivityLine icon={UsersRound} text={`Joined ${formatDateTime(row.user.createdAt)}`} />
                    <ActivityLine icon={BadgeCheck} text={`Updated ${formatDateTime(row.user.updatedAt)}`} />
                    <ActivityLine
                      icon={LifeBuoy}
                      text={row.support ? "Support history attached" : "No support history yet"}
                    />
                  </div>
                </TableCell>
                <TableCell className="whitespace-normal">
                  <div className="grid gap-2 sm:min-w-[220px]">
                    <RowAction
                      icon={CreditCard}
                      label="Subscription"
                      trailing={row.subscription?.planCode ?? "none"}
                      onClick={() => onOpenSubscription(row)}
                    />
                    <RowAction
                      icon={MessageSquareMore}
                      label={supportActionLabel(row)}
                      trailing={
                        row.support?.unreadForAdminCount
                          ? String(row.support.unreadForAdminCount)
                          : row.support?.status ?? "all"
                      }
                      emphasized={Boolean(row.support?.unreadForAdminCount)}
                      onClick={() => onOpenSupport(row)}
                    />
                    <RowAction
                      icon={MonitorSmartphone}
                      label="Devices"
                      trailing={String(row.subscription?.activeDeviceCount ?? 0)}
                      onClick={() => onOpenDevices(row)}
                    />
                    <RowAction
                      icon={UserCog}
                      label={
                        row.user.role === "superadmin"
                          ? "Protected root role"
                          : row.user.role === "admin"
                            ? "Set as user"
                            : "Set as admin"
                      }
                      trailing={row.user.role}
                      disabled={!canChangeRole || updatingRole}
                      title={roleTitle}
                      onClick={() =>
                        onChangeRole({
                          userId: row.user.id,
                          role: getNextAdminUserRole(row.user.role),
                        })
                      }
                    />
                  </div>
                </TableCell>
              </TableRow>
            );
          })
        ) : (
          <TableRow>
            <TableCell colSpan={6} className="py-10 text-center text-sm text-slate-500">
              No users matched the current filters.
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}

function RowAction({
  icon: Icon,
  label,
  trailing,
  emphasized = false,
  disabled = false,
  title,
  onClick,
}: {
  icon: typeof CreditCard;
  label: string;
  trailing: string;
  emphasized?: boolean;
  disabled?: boolean;
  title?: string;
  onClick: () => void;
}) {
  return (
    <Button
      type="button"
      size="sm"
      variant={emphasized ? "default" : "outline"}
      className={
        emphasized
          ? "h-9 justify-start gap-2 rounded-xl bg-amber-500 text-white hover:bg-amber-500/90"
          : "h-9 justify-start gap-2 rounded-xl border-slate-200 bg-white text-slate-800 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-65"
      }
      disabled={disabled}
      title={title}
      onClick={onClick}
    >
      <Icon className="h-4 w-4" />
      <span className="font-medium">{label}</span>
      <span
        className={
          emphasized
            ? "ml-auto rounded-full bg-white/20 px-2 py-0.5 text-[11px] font-bold"
            : "ml-auto text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500"
        }
      >
        {trailing}
      </span>
    </Button>
  );
}

function EmptyCell({ title, detail }: { title: string; detail: string }) {
  return (
    <div className="space-y-1 text-sm text-slate-500">
      <p>{title}</p>
      <p className="text-xs">{detail}</p>
    </div>
  );
}

function ActivityLine({ icon: Icon, text }: { icon: typeof UsersRound; text: string }) {
  return (
    <div className="flex items-center gap-2">
      <Icon className="h-4 w-4 text-slate-400" />
      <span>{text}</span>
    </div>
  );
}

const neutralTone = "border-slate-200 bg-slate-100 text-slate-700";
const verifiedTone = "border-emerald-200 bg-emerald-50 text-emerald-700";
const mfaTone = "border-blue-200 bg-blue-50 text-blue-700";
const suspendedTone = "border-amber-200 bg-amber-50 text-amber-700";

function roleTone(role: "user" | "admin" | "superadmin") {
  if (role === "superadmin") return "border-emerald-200 bg-emerald-50 text-emerald-700";
  if (role === "admin") return "border-violet-200 bg-violet-50 text-violet-700";
  return neutralTone;
}

function accountTone(status: AccountStatus) {
  if (status === "active") return verifiedTone;
  if (status === "suspended") return suspendedTone;
  return "border-rose-200 bg-rose-50 text-rose-700";
}

function subscriptionTone(status: string) {
  if (status === "active") return verifiedTone;
  if (status === "past_due") return suspendedTone;
  return neutralTone;
}

function supportTone(row: AdminUserDirectoryRow) {
  if (!row.support) return neutralTone;
  if (row.support.unreadForAdminCount > 0) return suspendedTone;
  if (row.support.status === "open") return mfaTone;
  return neutralTone;
}

function supportActionLabel(row: AdminUserDirectoryRow) {
  if (row.support?.unreadForAdminCount) return "Review support";
  if (row.support) return "Open support";
  return "Support inbox";
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString();
}

function formatDate(value: string | null) {
  return value ? new Date(value).toLocaleDateString() : "No end date";
}
