import type { ReactNode } from "react";
import { Search, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { AdminUserDirectoryFilters } from "../types";

type UserDirectoryFiltersProps = {
  filters: AdminUserDirectoryFilters;
  searchInput: string;
  onSearchInputChange: (value: string) => void;
  onSearch: () => void;
  onRoleChange: (role: AdminUserDirectoryFilters["role"]) => void;
  onAccountStatusChange: (status: AdminUserDirectoryFilters["accountStatus"]) => void;
  onReset: () => void;
};

export function UserDirectoryFilters({
  filters,
  searchInput,
  onSearchInputChange,
  onSearch,
  onRoleChange,
  onAccountStatusChange,
  onReset,
}: UserDirectoryFiltersProps) {
  return (
    <>
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_220px_220px_auto] xl:items-end">
        <div className="space-y-2">
          <Label htmlFor="user-search">Search</Label>
          <div className="flex gap-2">
            <Input
              id="user-search"
              value={searchInput}
              onChange={(event) => onSearchInputChange(event.target.value)}
              placeholder="Search name, email, or user id..."
            />
            <Button type="button" onClick={onSearch}>
              <Search className="mr-2 h-4 w-4" />
              Search
            </Button>
          </div>
        </div>

        <SelectFilter
          id="role-filter"
          label="Role"
          value={filters.role ?? "all"}
          onChange={(value) =>
            onRoleChange(value === "user" || value === "admin" || value === "superadmin" ? value : undefined)
          }
        >
          <option value="all">All roles</option>
          <option value="user">Users</option>
          <option value="admin">Admins</option>
          <option value="superadmin">Superadmins</option>
        </SelectFilter>

        <SelectFilter
          id="status-filter"
          label="Account status"
          value={filters.accountStatus ?? "all"}
          onChange={(value) =>
            onAccountStatusChange(
              value === "active" || value === "suspended" || value === "deactivated"
                ? value
                : undefined,
            )
          }
        >
          <option value="all">All statuses</option>
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
          <option value="deactivated">Deactivated</option>
        </SelectFilter>

        <Button type="button" variant="outline" onClick={onReset}>
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
          Use quick actions in each row to jump straight into subscription controls or the support
          inbox for that account.
        </p>
      </div>
    </>
  );
}

function SelectFilter({
  id,
  label,
  value,
  onChange,
  children,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  children: ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <select
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm"
      >
        {children}
      </select>
    </div>
  );
}
