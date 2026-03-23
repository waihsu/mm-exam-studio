import { Link, useRouterState } from "@tanstack/react-router";
import {
  BookText,
  Layers3,
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

type AdminSidebarProps = {
  className?: string;
  collapsed?: boolean;
};

const isActivePath = (currentPath: string, path: string) => {
  if (path === ADMIN_ROUTES.dashboard) {
    return currentPath === ADMIN_ROUTES.dashboard;
  }
  return currentPath === path || currentPath.startsWith(`${path}/`);
};

const iconForRoute = (to: string) => {
  if (to === ADMIN_ROUTES.dashboard) return LayoutDashboard;
  if (to === ADMIN_ROUTES.questions) return BookText;
  if (to === ADMIN_ROUTES.taxonomy || to.startsWith("/taxonomy")) return Layers3;
  if (
    to === ADMIN_ROUTES.users ||
    to === ADMIN_ROUTES.students ||
    to === ADMIN_ROUTES.userSubscriptions ||
    to === ADMIN_ROUTES.userSupport
  )
    return UsersRound;
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
        "group flex w-full items-center text-sm font-semibold transition-all",
        collapsed
          ? "mx-auto h-10 w-10 justify-center rounded-lg border border-transparent text-slate-600 hover:border-slate-200 hover:bg-slate-100 hover:text-slate-900"
          : "justify-between rounded-xl border border-transparent bg-transparent px-2.5 py-2 text-slate-700 hover:border-slate-300/90 hover:bg-white/88 hover:text-slate-900",
        isActive &&
          (collapsed
            ? "border-indigo-500 bg-indigo-600 text-white shadow-[0_10px_20px_-16px_rgba(49,46,129,0.9)]"
            : "border-indigo-300 bg-indigo-50 text-indigo-900 shadow-[0_10px_20px_-16px_rgba(49,46,129,0.7)]"),
      )}
    >
      <span className={cn("flex min-w-0 items-center", collapsed ? "justify-center" : "gap-2")}>
        <ItemIcon className="h-4 w-4 shrink-0" />
        {!collapsed ? <span className="truncate">{label}</span> : null}
      </span>
      {isActive && !collapsed ? (
        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-700" />
      ) : null}
    </Link>
  );
};

export function AdminSidebar({ className, collapsed = false }: AdminSidebarProps) {
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
        "h-full min-h-0 overflow-x-hidden overflow-y-auto overscroll-contain [scrollbar-gutter:stable] border-r border-white/75 bg-gradient-to-b from-white/88 to-slate-50/85 pl-3 pr-2 py-4 backdrop-blur-xl",
        collapsed &&
          "bg-gradient-to-b from-white/80 to-slate-100/70 px-1.5 py-3",
        className,
      )}
    >
      <div className={cn("space-y-2.5", collapsed && "space-y-2")}>
        {visibleGroups.map((group, groupIndex) => (
          <section
            key={group.id}
            className={cn(
              "rounded-2xl border border-white/75 bg-white/68 ring-1 ring-slate-900/5",
              collapsed ? "border-0 bg-transparent p-0 ring-0" : "p-1.5",
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
