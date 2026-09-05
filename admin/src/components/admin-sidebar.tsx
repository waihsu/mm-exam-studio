import { Link, useRouterState } from "@tanstack/react-router";
import {
  BookText,
  ChevronsLeft,
  ChevronsRight,
  Layers3,
  LifeBuoy,
  LayoutDashboard,
  Settings,
  ShieldCheck,
  UsersRound,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  ADMIN_ROUTES,
  ADMIN_SIDEBAR_NAV_GROUPS,
  type AdminNavItem,
} from "@/constants/routes";
import { useAuthFlow } from "@/features/auth/hooks/use-auth-flow";
import { useLanguage } from "@/i18n";
import { Button } from "./ui/button";

type AdminSidebarProps = {
  className?: string;
  collapsed?: boolean;
  onToggleCollapsed?: () => void;
};

const isActivePath = (currentPath: string, path: string) => {
  if (path === ADMIN_ROUTES.dashboard) {
    return currentPath === ADMIN_ROUTES.dashboard;
  }
  if (path === ADMIN_ROUTES.questions) {
    return (
      (currentPath === ADMIN_ROUTES.questions ||
        currentPath.startsWith(`${ADMIN_ROUTES.questions}/`)) &&
      !currentPath.startsWith(`${ADMIN_ROUTES.questionBlueprints}/`) &&
      currentPath !== ADMIN_ROUTES.questionBlueprints
    );
  }
  if (path === ADMIN_ROUTES.users) {
    return (
      (currentPath === ADMIN_ROUTES.users ||
        currentPath.startsWith(`${ADMIN_ROUTES.users}/`)) &&
      !currentPath.startsWith(`${ADMIN_ROUTES.userSubscriptions}/`) &&
      !currentPath.startsWith(`${ADMIN_ROUTES.userSupport}/`) &&
      currentPath !== ADMIN_ROUTES.userSubscriptions &&
      currentPath !== ADMIN_ROUTES.userSupport
    );
  }
  return currentPath === path || currentPath.startsWith(`${path}/`);
};

const iconForRoute = (to: string) => {
  if (to === ADMIN_ROUTES.dashboard) return LayoutDashboard;
  if (to === ADMIN_ROUTES.questions) return BookText;
  if (
    to === ADMIN_ROUTES.questionBlueprints ||
    to.startsWith(`${ADMIN_ROUTES.questionBlueprints}/`)
  ) {
    return Layers3;
  }
  if (to === ADMIN_ROUTES.taxonomy || to.startsWith("/taxonomy")) return Layers3;
  if (to === ADMIN_ROUTES.userSupport) return LifeBuoy;
  if (to === ADMIN_ROUTES.users) return UsersRound;
  if (to === ADMIN_ROUTES.settings || to.startsWith("/settings")) return Settings;
  return ShieldCheck;
};

const renderSidebarLink = (
  item: AdminNavItem,
  pathname: string,
  tr: (value: { en: string; my: string }) => string,
  collapsed: boolean,
) => {
  const isActive = isActivePath(pathname, item.to);
  const ItemIcon = iconForRoute(item.to);
  const label = tr(item.label);

  return (
    <Link
      key={`${item.to}-${label}`}
      to={item.to}
      title={label}
      className={cn(
        "group flex w-full items-center text-sm font-medium transition-colors",
        collapsed
          ? "mx-auto h-9 w-9 justify-center rounded-lg border border-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-950"
          : "justify-between rounded-lg border border-transparent bg-transparent px-2.5 py-2 text-slate-700 hover:bg-slate-100 hover:text-slate-950",
        isActive &&
          (collapsed
            ? "bg-slate-900 text-white shadow-sm"
            : "border-slate-900 bg-slate-900 text-white shadow-sm"),
      )}
    >
        <span className={cn("flex min-w-0 items-center", collapsed ? "justify-center" : "gap-2.5")}>
        <ItemIcon className="h-4 w-4 shrink-0" />
        {!collapsed ? <span className="truncate">{label}</span> : null}
      </span>
      {isActive && !collapsed ? (
        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-white" />
      ) : null}
    </Link>
  );
};

export function AdminSidebar({
  className,
  collapsed = false,
  onToggleCollapsed,
}: AdminSidebarProps) {
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });
  const { isAdmin, isSuperAdmin } = useAuthFlow();
  const { tr } = useLanguage();

  const visibleGroups = ADMIN_SIDEBAR_NAV_GROUPS.map((group) => ({
    ...group,
    items: group.items.filter(
      (item) =>
        (!item.adminOnly || isAdmin) &&
        (!item.superadminOnly || isSuperAdmin),
    ),
  })).filter((group) => group.items.length > 0);

  return (
    <aside
      className={cn(
        "h-full min-h-0 overflow-x-hidden overflow-y-auto overscroll-contain [scrollbar-gutter:stable] bg-white pl-3 pr-2 py-4",
        collapsed &&
          "bg-white px-1.5 py-3",
        className,
      )}
    >
      <div
        className={cn(
          "mb-3 flex items-center",
          collapsed ? "justify-center px-0.5" : "justify-between px-1",
        )}
      >
        {!collapsed ? (
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">
              Workspace nav
            </p>
            <p className="mt-1 text-sm font-semibold text-slate-900">Admin controls</p>
          </div>
        ) : null}
        {onToggleCollapsed ? (
          <Button
            type="button"
            variant="outline"
            size="icon"
            className={cn(
              "shrink-0 rounded-xl border-slate-300/80 bg-white/90 text-slate-700 shadow-[0_10px_24px_-18px_rgba(15,23,42,0.65)]",
              collapsed ? "h-10 w-10" : "h-9 w-9",
            )}
            onClick={onToggleCollapsed}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? (
              <ChevronsRight className="h-4 w-4" />
            ) : (
              <ChevronsLeft className="h-4 w-4" />
            )}
          </Button>
        ) : null}
      </div>

      <div className={cn("space-y-2.5", collapsed && "space-y-2")}>
        {visibleGroups.map((group, groupIndex) => (
          <section
            key={group.id}
            className={cn(
              "border-0 bg-transparent",
              collapsed ? "p-0" : "py-1",
            )}
          >
            {collapsed && groupIndex > 0 ? (
              <div className="mx-auto mb-2 h-px w-8 bg-slate-300/70" />
            ) : null}
            {!collapsed ? (
              <p className="px-1 pb-2 text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">
                {tr(group.label)}
              </p>
            ) : null}
            <div className="space-y-1">
              {group.items.map((item) =>
                renderSidebarLink(item, pathname, tr, collapsed),
              )}
            </div>
          </section>
        ))}
      </div>
    </aside>
  );
}
