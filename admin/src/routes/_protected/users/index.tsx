import { createFileRoute } from "@tanstack/react-router";
import {
  UserDirectoryPage,
} from "@/features/users/pages/user-directory-page";
import type { AdminUserDirectoryFilters } from "@/features/users/types";

export const Route = createFileRoute("/_protected/users/")({
  validateSearch: (search): AdminUserDirectoryFilters => ({
    page: toPositiveNumber(search.page),
    pageSize: toPositiveNumber(search.pageSize),
    search: typeof search.search === "string" ? search.search : undefined,
    role: search.role === "user" || search.role === "admin" || search.role === "superadmin" ? search.role : undefined,
    accountStatus: search.accountStatus === "active" || search.accountStatus === "suspended" || search.accountStatus === "deactivated" ? search.accountStatus : undefined,
  }),
  component: UsersIndexRoute,
});

function UsersIndexRoute() {
  return <UserDirectoryPage search={Route.useSearch()} />;
}

function toPositiveNumber(value: unknown) {
  const parsed = typeof value === "number" ? value : typeof value === "string" ? Number(value) : undefined;
  return parsed && parsed > 0 ? parsed : undefined;
}
