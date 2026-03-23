import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  AlertCircle,
  BadgeCheck,
  CreditCard,
  Laptop,
  LoaderCircle,
  LifeBuoy,
  MessageSquareMore,
  MonitorSmartphone,
  Search,
  ShieldX,
  ShieldCheck,
  Smartphone,
  UserCog,
  UsersRound,
} from "lucide-react";
import { PaginationControls } from "@/components/data-table/pagination-controls";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PagePanel } from "@/components/page-container";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "@/components/ui/sonner";
import { usersApi } from "@/features/users/api/users.api";
import type {
  AccountStatus,
  AdminUserDirectoryFilters,
  AdminUserDeviceRow,
  AdminUserDirectoryRow,
} from "@/features/users/types";

export const Route = createFileRoute("/_protected/users/")({
  validateSearch: (search): AdminUserDirectoryFilters => ({
    page:
      typeof search.page === "number"
        ? search.page
        : typeof search.page === "string"
          ? Number(search.page) || DEFAULT_PAGE
          : undefined,
    pageSize:
      typeof search.pageSize === "number"
        ? search.pageSize
        : typeof search.pageSize === "string"
          ? Number(search.pageSize) || DEFAULT_PAGE_SIZE
          : undefined,
    search: typeof search.search === "string" ? search.search : undefined,
    role:
      search.role === "user" || search.role === "admin"
        ? search.role
        : undefined,
    accountStatus:
      search.accountStatus === "active" ||
      search.accountStatus === "suspended" ||
      search.accountStatus === "deactivated"
        ? search.accountStatus
        : undefined,
  }),
  component: UsersIndexPage,
});

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 12;
const PAGE_SIZE_OPTIONS = [12, 24, 48];

const formatDateTime = (value: string) => new Date(value).toLocaleString();
const formatDate = (value: string | null) =>
  value ? new Date(value).toLocaleDateString() : "No end date";

const roleTone = (role: "user" | "admin") =>
  role === "admin"
    ? "border-violet-200 bg-violet-50 text-violet-700"
    : "border-slate-200 bg-slate-100 text-slate-700";

const accountTone = (status: AccountStatus) => {
  if (status === "active") return "border-emerald-200 bg-emerald-50 text-emerald-700";
  if (status === "suspended") return "border-amber-200 bg-amber-50 text-amber-700";
  return "border-rose-200 bg-rose-50 text-rose-700";
};

const subscriptionTone = (status: string) => {
  if (status === "active") return "border-emerald-200 bg-emerald-50 text-emerald-700";
  if (status === "past_due") return "border-amber-200 bg-amber-50 text-amber-700";
  return "border-slate-200 bg-slate-100 text-slate-700";
};

const supportTone = (row: AdminUserDirectoryRow) => {
  if (!row.support) {
    return "border-slate-200 bg-slate-100 text-slate-700";
  }
  if (row.support.unreadForAdminCount > 0) {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }
  if (row.support.status === "open") {
    return "border-blue-200 bg-blue-50 text-blue-700";
  }
  return "border-slate-200 bg-slate-100 text-slate-700";
};

const supportActionLabel = (row: AdminUserDirectoryRow) => {
  if (row.support?.unreadForAdminCount) {
    return "Review support";
  }

  if (row.support) {
    return "Open support";
  }

  return "Support inbox";
};

const deviceTypeTone: Record<AdminUserDeviceRow["deviceType"], string> = {
  mobile: "border-blue-200 bg-blue-50 text-blue-700",
  desktop: "border-violet-200 bg-violet-50 text-violet-700",
  unknown: "border-slate-200 bg-slate-100 text-slate-700",
};

const deviceTypeIcon = (type: AdminUserDeviceRow["deviceType"]) => {
  if (type === "mobile") return Smartphone;
  if (type === "desktop") return Laptop;
  return MonitorSmartphone;
};

const formatLastSeenAt = (value: string | null) =>
  value ? new Date(value).toLocaleString() : "Unknown activity";

function UsersIndexPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const search = Route.useSearch();
  const page = search.page ?? DEFAULT_PAGE;
  const pageSize = search.pageSize ?? DEFAULT_PAGE_SIZE;
  const [searchInput, setSearchInput] = useState(search.search ?? "");
  const [selectedDeviceUser, setSelectedDeviceUser] = useState<
    AdminUserDirectoryRow["user"] | null
  >(null);
  const selectedDeviceUserId = selectedDeviceUser?.id ?? null;

  useEffect(() => {
    setSearchInput(search.search ?? "");
  }, [search.search]);

  const directoryQuery = useQuery({
    queryKey: [
      "admin-user-directory",
      page,
      pageSize,
      search.search ?? "",
      search.role ?? "",
      search.accountStatus ?? "",
    ],
    queryFn: async () => {
      const response = await usersApi.getDirectory({
        page,
        pageSize,
        search: search.search,
        role: search.role,
        accountStatus: search.accountStatus,
      });
      if (!response.ok) {
        throw new Error(response.message);
      }
      return response.data;
    },
    placeholderData: (previousData) => previousData,
  });

  const devicesQuery = useQuery({
    queryKey: ["admin-user-devices", selectedDeviceUserId],
    queryFn: async () => {
      if (!selectedDeviceUserId) {
        throw new Error("No user selected.");
      }

      const response = await usersApi.getUserDevices(selectedDeviceUserId);
      if (!response.ok) {
        throw new Error(response.message);
      }
      return response.data;
    },
    enabled: Boolean(selectedDeviceUserId),
  });

  const revokeDeviceMutation = useMutation({
    mutationFn: async (params: { userId: string; deviceId: string }) => {
      const response = await usersApi.revokeUserDevice(params.userId, params.deviceId);
      if (!response.ok) {
        throw new Error(response.message);
      }
      return response.data;
    },
    onSuccess: async (result, variables) => {
      toast.success(
        result.alreadyRevoked
          ? "Device was already revoked."
          : "Device access revoked.",
      );

      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["admin-user-devices", variables.userId],
        }),
        queryClient.invalidateQueries({ queryKey: ["admin-user-directory"] }),
        queryClient.invalidateQueries({ queryKey: ["admin-subscriptions"] }),
      ]);
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Failed to revoke device");
    },
  });

  if (directoryQuery.isLoading && !directoryQuery.data) {
    return <PagePanel className="bg-white/88">Loading user directory...</PagePanel>;
  }

  if (directoryQuery.error instanceof Error || !directoryQuery.data) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Could not load users</AlertTitle>
        <AlertDescription>
          {directoryQuery.error instanceof Error
            ? directoryQuery.error.message
            : "Missing user directory data."}
        </AlertDescription>
      </Alert>
    );
  }

  const directory = directoryQuery.data;
  const rows = directory.rows;
  const from = directory.total === 0 ? 0 : (directory.page - 1) * directory.pageSize + 1;
  const to =
    directory.total === 0
      ? 0
      : Math.min(
          (directory.page - 1) * directory.pageSize + directory.rows.length,
          directory.total,
        );
  const totalPages = Math.max(1, Math.ceil(directory.total / directory.pageSize));
  const adminCount = rows.filter((row) => row.user.role === "admin").length;
  const supportWaitingCount = rows.filter(
    (row) => (row.support?.unreadForAdminCount ?? 0) > 0,
  ).length;
  const protectedCount = rows.filter(
    (row) => row.user.emailVerified && row.user.twoFactorEnabled,
  ).length;

  return (
    <div className="space-y-4">
      <PagePanel className="space-y-5 bg-gradient-to-br from-white/95 via-slate-50/90 to-slate-100/70">
        <div className="space-y-3 lg:flex lg:items-start lg:justify-between lg:space-y-0">
          <div className="space-y-2">
            <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-900 text-white">
              <UserCog className="h-5 w-5" />
            </div>
            <h2 className="text-2xl font-black text-slate-900">User overview</h2>
            <p className="max-w-3xl text-sm leading-7 text-slate-600">
              Search the full account directory, spot weak security posture, and catch support
              threads that are waiting on admin without opening three separate tabs first.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <div className="rounded-2xl border border-slate-200 bg-white/90 px-3 py-2">
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">
                Results
              </p>
              <p className="mt-1 text-lg font-black text-slate-900">{directory.total}</p>
            </div>
            <div className="rounded-2xl border border-violet-200 bg-violet-50/80 px-3 py-2">
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-violet-700">
                Admins
              </p>
              <p className="mt-1 text-lg font-black text-violet-900">{adminCount}</p>
            </div>
            <div className="rounded-2xl border border-amber-200 bg-amber-50/80 px-3 py-2">
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-amber-700">
                Support waiting
              </p>
              <p className="mt-1 text-lg font-black text-amber-900">{supportWaitingCount}</p>
            </div>
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/80 px-3 py-2">
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-emerald-700">
                Verified + 2FA
              </p>
              <p className="mt-1 text-lg font-black text-emerald-900">{protectedCount}</p>
            </div>
          </div>
        </div>
      </PagePanel>

      <PagePanel className="space-y-4 bg-white/90">
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_220px_220px_auto] xl:items-end">
          <div className="space-y-2">
            <Label htmlFor="user-search">Search</Label>
            <div className="flex gap-2">
              <Input
                id="user-search"
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder="Search name, email, or user id..."
              />
              <Button
                type="button"
                onClick={() => {
                  void navigate({
                    to: "/users",
                    search: (current) => ({
                      ...current,
                      page: undefined,
                      search: searchInput.trim() || undefined,
                    }),
                  });
                }}
              >
                <Search className="mr-2 h-4 w-4" />
                Search
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="role-filter">Role</Label>
            <select
              id="role-filter"
              value={search.role ?? "all"}
              onChange={(event) => {
                const nextValue = event.target.value;
                void navigate({
                  to: "/users",
                  search: (current) => ({
                    ...current,
                    page: undefined,
                    role:
                      nextValue === "user" || nextValue === "admin" ? nextValue : undefined,
                  }),
                });
              }}
              className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm"
            >
              <option value="all">All roles</option>
              <option value="user">Users</option>
              <option value="admin">Admins</option>
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="status-filter">Account status</Label>
            <select
              id="status-filter"
              value={search.accountStatus ?? "all"}
              onChange={(event) => {
                const nextValue = event.target.value;
                void navigate({
                  to: "/users",
                  search: (current) => ({
                    ...current,
                    page: undefined,
                    accountStatus:
                      nextValue === "active" ||
                      nextValue === "suspended" ||
                      nextValue === "deactivated"
                        ? nextValue
                        : undefined,
                  }),
                });
              }}
              className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm"
            >
              <option value="all">All statuses</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
              <option value="deactivated">Deactivated</option>
            </select>
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setSearchInput("");
              void navigate({ to: "/users", search: {} });
            }}
          >
            Reset
          </Button>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-3">
          <p className="flex items-center gap-2 text-sm font-medium text-slate-700">
            <ShieldCheck className="h-4 w-4" />
            Verified email and 2FA are separated here so weak admin accounts stand out before they
            become audit findings.
          </p>
          <p className="mt-2 text-xs text-slate-500">
            Use quick actions in each row to jump straight into subscription controls or the
            support inbox for that account.
          </p>
        </div>

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
              rows.map((row) => (
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
                        <Badge
                          className={
                            row.user.emailVerified
                              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                              : "border-slate-200 bg-slate-100 text-slate-700"
                          }
                        >
                          {row.user.emailVerified ? "email verified" : "email unverified"}
                        </Badge>
                        <Badge
                          className={
                            row.user.twoFactorEnabled
                              ? "border-blue-200 bg-blue-50 text-blue-700"
                              : "border-slate-200 bg-slate-100 text-slate-700"
                          }
                        >
                          {row.user.twoFactorEnabled ? "2FA on" : "2FA off"}
                        </Badge>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="whitespace-normal">
                    {row.subscription ? (
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge className="border-slate-200 bg-slate-100 text-slate-700">
                            {row.subscription.planCode}
                          </Badge>
                          <Badge className={subscriptionTone(row.subscription.status)}>
                            {row.subscription.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-slate-700">
                          {row.subscription.planName} • {row.subscription.billingCycle}
                        </p>
                        <p className="text-xs text-slate-500">
                          Devices {row.subscription.activeDeviceCount} • Ends{" "}
                          {formatDate(row.subscription.endsAt)}
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-1 text-sm text-slate-500">
                        <p>No subscription snapshot</p>
                        <p className="text-xs">This account has not been assigned a plan row yet.</p>
                      </div>
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
                          <Badge
                            className={
                              row.support.allowUserReplies
                                ? "border-blue-200 bg-blue-50 text-blue-700"
                                : "border-amber-200 bg-amber-50 text-amber-700"
                            }
                          >
                            {row.support.allowUserReplies ? "replies on" : "replies off"}
                          </Badge>
                        </div>
                        <p className="text-sm text-slate-700">
                          {row.support.lastMessagePreview ?? "No message preview yet"}
                        </p>
                        <p className="text-xs text-slate-500">
                          Last support activity{" "}
                          {row.support.lastMessageAt
                            ? formatDateTime(row.support.lastMessageAt)
                            : "not started"}
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-1 text-sm text-slate-500">
                        <p>No support thread</p>
                        <p className="text-xs">A thread appears after the user opens support once.</p>
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="whitespace-normal">
                    <div className="space-y-2 text-sm text-slate-600">
                      <div className="flex items-center gap-2">
                        <UsersRound className="h-4 w-4 text-slate-400" />
                        <span>Joined {formatDateTime(row.user.createdAt)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <BadgeCheck className="h-4 w-4 text-slate-400" />
                        <span>Updated {formatDateTime(row.user.updatedAt)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <LifeBuoy className="h-4 w-4 text-slate-400" />
                        <span>
                          {row.support ? "Support history attached" : "No support history yet"}
                        </span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="whitespace-normal">
                    <div className="grid gap-2 sm:min-w-[220px]">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="h-9 justify-start gap-2 rounded-xl border-slate-200 bg-slate-50 text-slate-800 hover:bg-slate-100"
                        onClick={() => {
                          void navigate({
                            to: "/users/subscriptions",
                            search: {
                              page: undefined,
                              pageSize: undefined,
                              search: row.user.email,
                            },
                          });
                        }}
                      >
                        <CreditCard className="h-4 w-4" />
                        <span className="font-medium">Subscription</span>
                        <span className="ml-auto text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                          {row.subscription?.planCode ?? "none"}
                        </span>
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant={row.support?.unreadForAdminCount ? "default" : "outline"}
                        className={
                          row.support?.unreadForAdminCount
                            ? "h-9 justify-start gap-2 rounded-xl bg-amber-500 text-white hover:bg-amber-500/90"
                            : "h-9 justify-start gap-2 rounded-xl border-slate-200 bg-white text-slate-800 hover:bg-slate-50"
                        }
                        onClick={() => {
                          void navigate({
                            to: "/users/support",
                            search: {
                              search: row.user.email,
                              status: row.support?.status ?? "all",
                              conversationId: row.support?.conversationId,
                            },
                          });
                        }}
                      >
                        <MessageSquareMore className="h-4 w-4" />
                        <span className="font-medium">{supportActionLabel(row)}</span>
                        {row.support?.unreadForAdminCount ? (
                          <span className="ml-auto rounded-full bg-white/20 px-2 py-0.5 text-[11px] font-bold">
                            {row.support.unreadForAdminCount}
                          </span>
                        ) : (
                          <span className="ml-auto text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                            {row.support ? row.support.status : "all"}
                          </span>
                        )}
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="h-9 justify-start gap-2 rounded-xl border-slate-200 bg-white text-slate-800 hover:bg-slate-50"
                        onClick={() => {
                          setSelectedDeviceUser(row.user);
                        }}
                      >
                        <MonitorSmartphone className="h-4 w-4" />
                        <span className="font-medium">Devices</span>
                        <span className="ml-auto text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                          {row.subscription?.activeDeviceCount ?? 0}
                        </span>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="py-10 text-center text-sm text-slate-500">
                  No users matched the current filters.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        <PaginationControls
          page={directory.page}
          totalPages={totalPages}
          totalRows={directory.total}
          from={from}
          to={to}
          pageSize={directory.pageSize}
          pageSizeOptions={PAGE_SIZE_OPTIONS}
          onPageSizeChange={(nextSize) => {
            void navigate({
              to: "/users",
              search: (current) => ({
                ...current,
                page: undefined,
                pageSize: nextSize === DEFAULT_PAGE_SIZE ? undefined : nextSize,
              }),
            });
          }}
          onPrev={() => {
            if (directory.page <= 1) return;
            void navigate({
              to: "/users",
              search: (current) => ({
                ...current,
                page: directory.page - 1 === DEFAULT_PAGE ? undefined : directory.page - 1,
              }),
            });
          }}
          onNext={() => {
            if (directory.page >= totalPages) return;
            void navigate({
              to: "/users",
              search: (current) => ({
                ...current,
                page: directory.page + 1,
              }),
            });
          }}
        />
      </PagePanel>

      <Dialog
        open={Boolean(selectedDeviceUser)}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedDeviceUser(null);
          }
        }}
      >
        <DialogContent className="max-w-3xl p-0">
          <DialogHeader className="border-b border-slate-200 px-6 py-5">
            <DialogTitle className="flex items-center gap-2 text-slate-900">
              <MonitorSmartphone className="h-5 w-5 text-slate-600" />
              Manage devices
            </DialogTitle>
            <DialogDescription className="space-y-1 text-slate-600">
              <span className="block font-medium text-slate-800">
                {selectedDeviceUser?.name ?? "User"}
              </span>
              <span className="block">{selectedDeviceUser?.email}</span>
            </DialogDescription>
          </DialogHeader>

          <div className="max-h-[68vh] space-y-4 overflow-y-auto px-6 py-5">
            {devicesQuery.isLoading ? (
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <LoaderCircle className="h-4 w-4 animate-spin" />
                Loading active devices...
              </div>
            ) : devicesQuery.error instanceof Error ? (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Could not load devices</AlertTitle>
                <AlertDescription>{devicesQuery.error.message}</AlertDescription>
              </Alert>
            ) : devicesQuery.data ? (
              <>
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                  Active devices {devicesQuery.data.activeDeviceCount} /{" "}
                  {devicesQuery.data.deviceLimit}
                </div>

                {devicesQuery.data.devices.length ? (
                  <div className="space-y-3">
                    {devicesQuery.data.devices.map((device) => {
                      const DeviceIcon = deviceTypeIcon(device.deviceType);
                      const isRevoking =
                        revokeDeviceMutation.isPending &&
                        revokeDeviceMutation.variables?.deviceId === device.id;

                      return (
                        <div
                          key={device.id}
                          className="rounded-2xl border border-slate-200 bg-white px-4 py-3"
                        >
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div className="min-w-0 flex-1 space-y-2">
                              <div className="flex flex-wrap items-center gap-2">
                                <Badge className={deviceTypeTone[device.deviceType]}>
                                  <DeviceIcon className="mr-1 h-3.5 w-3.5" />
                                  {device.deviceType}
                                </Badge>
                                <span className="text-sm font-medium text-slate-900">
                                  {device.deviceLabel ?? "Unnamed device"}
                                </span>
                              </div>
                              <p className="text-xs text-slate-500">
                                Last seen {formatLastSeenAt(device.lastSeenAt)}
                              </p>
                              {device.userAgent ? (
                                <p className="break-all text-xs text-slate-400">
                                  {device.userAgent}
                                </p>
                              ) : null}
                            </div>
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              className="h-8 rounded-lg border-rose-200 text-rose-700 hover:bg-rose-50"
                              disabled={isRevoking || !selectedDeviceUser}
                              onClick={() => {
                                if (!selectedDeviceUser) return;
                                revokeDeviceMutation.mutate({
                                  userId: selectedDeviceUser.id,
                                  deviceId: device.id,
                                });
                              }}
                            >
                              {isRevoking ? (
                                <LoaderCircle className="mr-1 h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <ShieldX className="mr-1 h-3.5 w-3.5" />
                              )}
                              Revoke
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-slate-500">No active device records found.</p>
                )}
              </>
            ) : null}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
