import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import {
  AlertCircle,
} from "lucide-react";
import { PaginationControls } from "@/components/data-table/pagination-controls";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { PagePanel } from "@/components/page-container";
import { AdminPageHeader, AdminStatPill } from "@/components/page-shell";
import { toast } from "@/components/ui/sonner";
import { useAuthFlow } from "@/features/auth/hooks/use-auth-flow";
import { usersApi } from "@/features/users/api/users.api";
import { UserDirectoryFilters } from "@/features/users/components/user-directory-filters";
import { UserDevicesDialog } from "@/features/users/components/user-devices-dialog";
import { UserDirectoryTable } from "@/features/users/components/user-directory-table";
import type {
  AdminUserDirectoryFilters,
  AdminUserDirectoryRow,
} from "@/features/users/types";

export const USER_DIRECTORY_DEFAULT_PAGE = 1;
export const USER_DIRECTORY_DEFAULT_PAGE_SIZE = 12;
const PAGE_SIZE_OPTIONS = [12, 24, 48];

type UserDirectoryPageProps = {
  search: AdminUserDirectoryFilters;
};

export function UserDirectoryPage({ search }: UserDirectoryPageProps) {
  const { isSuperAdmin, user: authUser } = useAuthFlow();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const page = search.page ?? USER_DIRECTORY_DEFAULT_PAGE;
  const pageSize = search.pageSize ?? USER_DIRECTORY_DEFAULT_PAGE_SIZE;
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

  const updateUserRoleMutation = useMutation({
    mutationFn: async (params: { userId: string; role: "user" | "admin" }) => {
      const response = await usersApi.updateUserRole(params.userId, params.role);
      if (!response.ok) {
        throw new Error(response.message);
      }
      return response.data;
    },
    onSuccess: async (result) => {
      toast.success(
        result.changed
          ? `Role updated to ${result.user.role}.`
          : `Role is already ${result.user.role}.`,
      );
      await queryClient.invalidateQueries({ queryKey: ["admin-user-directory"] });
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Failed to update role.");
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
  const adminCount = rows.filter(
    (row) => row.user.role === "admin" || row.user.role === "superadmin",
  ).length;
  const supportWaitingCount = rows.filter(
    (row) => (row.support?.unreadForAdminCount ?? 0) > 0,
  ).length;
  const protectedCount = rows.filter(
    (row) => row.user.emailVerified && row.user.twoFactorEnabled,
  ).length;

  return (
    <div className="space-y-4">
      <AdminPageHeader
        eyebrow="People"
        title="User overview"
        description="Search the full account directory, spot weak security posture, and catch support threads that are waiting on admin without opening separate tools."
        actions={
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <AdminStatPill label="Results" value={String(directory.total)} />
            <AdminStatPill label="Admins" value={String(adminCount)} tone="violet" />
            <AdminStatPill
              label="Support waiting"
              value={String(supportWaitingCount)}
              tone="amber"
            />
            <AdminStatPill
              label="Verified + 2FA"
              value={String(protectedCount)}
              tone="emerald"
            />
          </div>
        }
      />

      <PagePanel className="space-y-4 bg-white/90">
        <UserDirectoryFilters
          filters={search}
          searchInput={searchInput}
          onSearchInputChange={setSearchInput}
          onSearch={() => {
            void navigate({
              to: "/users",
              search: (current) => ({
                ...current,
                page: undefined,
                search: searchInput.trim() || undefined,
              }),
            });
          }}
          onRoleChange={(role) => {
            void navigate({
              to: "/users",
              search: (current) => ({ ...current, page: undefined, role }),
            });
          }}
          onAccountStatusChange={(accountStatus) => {
            void navigate({
              to: "/users",
              search: (current) => ({ ...current, page: undefined, accountStatus }),
            });
          }}
          onReset={() => {
            setSearchInput("");
            void navigate({ to: "/users", search: {} });
          }}
        />

        <UserDirectoryTable
          rows={rows}
          isSuperAdmin={isSuperAdmin}
          actorUserId={authUser?.id}
          updatingRole={updateUserRoleMutation.isPending}
          onOpenSubscription={(row) => {
            void navigate({
              to: "/users/subscriptions",
              search: {
                page: undefined,
                pageSize: undefined,
                search: row.user.email,
              },
            });
          }}
          onOpenSupport={(row) => {
            void navigate({
              to: "/users/support",
              search: {
                search: row.user.email,
                status: row.support?.status ?? "all",
                conversationId: row.support?.conversationId,
              },
            });
          }}
          onOpenDevices={(row) => {
            setSelectedDeviceUser(row.user);
          }}
          onChangeRole={(input) => {
            updateUserRoleMutation.mutate(input);
          }}
        />

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
                pageSize: nextSize === USER_DIRECTORY_DEFAULT_PAGE_SIZE ? undefined : nextSize,
              }),
            });
          }}
          onPrev={() => {
            if (directory.page <= 1) return;
            void navigate({
              to: "/users",
              search: (current) => ({
                ...current,
                page: directory.page - 1 === USER_DIRECTORY_DEFAULT_PAGE ? undefined : directory.page - 1,
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

      <UserDevicesDialog
        user={selectedDeviceUser}
        loading={devicesQuery.isLoading}
        error={devicesQuery.error instanceof Error ? devicesQuery.error : null}
        devices={devicesQuery.data}
        revokingDeviceId={
          revokeDeviceMutation.isPending ? revokeDeviceMutation.variables?.deviceId : undefined
        }
        onOpenChange={(open) => {
          if (!open) setSelectedDeviceUser(null);
        }}
        onRevoke={(deviceId) => {
          if (!selectedDeviceUser) return;
          revokeDeviceMutation.mutate({ userId: selectedDeviceUser.id, deviceId });
        }}
      />

    </div>
  );
}
