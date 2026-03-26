import { useState, type ComponentType, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import {
  Bell,
  ChevronsLeft,
  ChevronsRight,
  CreditCard,
  LogOut,
  Menu,
  MessageSquareMore,
  RefreshCcw,
  Settings,
  User2,
  X,
} from "lucide-react";
import studyAppLogo from "@/assets/study-app-logo.svg";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { userAppRoutes, accountNavItems, plannedNavItems, primaryNavItems } from "@/constants/routes";
import { useAuthFlow } from "@/features/auth/hooks/use-auth-flow";
import { workspaceApi } from "@/features/workspace/api/workspace-api";
import { cn } from "@/lib/utils";

type NavItem = {
  to: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
  status: "live" | "planned";
};

function DesktopNavSection({
  title,
  items,
  pathname,
  collapsed,
}: {
  title: string;
  items: readonly NavItem[];
  pathname: string;
  collapsed: boolean;
}) {
  return (
    <section
      className={cn(
        "rounded-2xl border border-white/75 bg-white/68 ring-1 ring-slate-900/5",
        collapsed ? "border-0 bg-transparent p-0 ring-0" : "p-1.5",
      )}
    >
      {!collapsed ? (
        <p className="px-1 pb-2 text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">
          {title}
        </p>
      ) : null}
      <div className="space-y-1">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.to || pathname.startsWith(`${item.to}/`);

          return (
            <Link
              key={item.to}
              to={item.to}
              title={item.label}
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
                <Icon className="h-4 w-4 shrink-0" />
                {!collapsed ? <span className="truncate">{item.label}</span> : null}
              </span>
              {isActive && !collapsed ? (
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-700" />
              ) : null}
            </Link>
          );
        })}
      </div>
    </section>
  );
}

function MobileNavLink({
  item,
  pathname,
  onNavigate,
}: {
  item: NavItem;
  pathname: string;
  onNavigate: () => void;
}) {
  const Icon = item.icon;
  const isActive = pathname === item.to || pathname.startsWith(`${item.to}/`);

  return (
    <Link
      to={item.to}
      onClick={onNavigate}
      className={cn(
        "flex items-center justify-between rounded-2xl border px-3 py-3 text-sm font-semibold transition",
        isActive
          ? "border-indigo-300 bg-indigo-50 text-indigo-900 shadow-[0_10px_20px_-16px_rgba(49,46,129,0.7)]"
          : "border-slate-200 bg-white/90 text-slate-700 hover:border-slate-300 hover:bg-white",
      )}
    >
      <span className="flex min-w-0 items-center gap-3">
        <Icon className="h-4 w-4 shrink-0" />
        <span className="truncate">{item.label}</span>
      </span>
      {isActive ? <span className="h-2 w-2 rounded-full bg-indigo-700" /> : null}
    </Link>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const { user, session, signOut } = useAuthFlow();
  const summaryQuery = useQuery({
    queryKey: ["workspace-summary", "app-shell"],
    queryFn: () => workspaceApi.getSummary(),
    staleTime: 60_000,
  });

  const pathname = location.pathname;
  const userDisplayName = user?.name || user?.email || "Signed-in account";
  const userInitial = (userDisplayName[0] ?? "U").toUpperCase();
  const currentPlanName = summaryQuery.data?.ok
    ? summaryQuery.data.data.subscription.name
    : "Free";
  const notificationSummary = summaryQuery.data?.ok
    ? summaryQuery.data.data.notifications
    : null;
  const desktopNotificationCount = notificationSummary?.unreadCount ?? 0;

  const handleSignOut = async () => {
    const result = await signOut();
    if (!result.ok) return;
    await navigate({ to: "/signin" });
  };

  const handleSwitchAccount = async () => {
    const result = await signOut();
    if (!result.ok) return;
    await navigate({ to: "/signin" });
  };

  const mobileGroups = [
    { title: "Workspace", items: primaryNavItems },
    { title: "Account", items: accountNavItems },
    ...(plannedNavItems.length > 0 ? [{ title: "Coming up", items: plannedNavItems }] : []),
  ] as const;

  return (
    <div className="relative isolate h-[100dvh] overflow-hidden text-slate-900">
      <header className="sticky top-0 z-[180] min-h-[var(--client-header-height,4rem)] border-b border-white/70 bg-gradient-to-b from-white/94 to-white/82 backdrop-blur-xl">
        <div className="mx-auto flex h-[var(--client-header-height,4rem)] w-full max-w-none items-center justify-between gap-3 px-3 md:px-4 lg:px-6">
          <div className="flex min-w-0 items-center gap-2">
            <Link
              to={userAppRoutes.dashboard}
              className="group inline-flex items-center gap-2 rounded-2xl border border-white/75 bg-white/92 px-3 py-1.5 shadow-[0_10px_22px_-18px_rgba(15,23,42,0.75)] ring-1 ring-slate-900/5 transition hover:-translate-y-0.5"
            >
              <img
                src={studyAppLogo}
                alt="Study App logo"
                className="h-8 w-8 rounded-xl shadow-sm shadow-emerald-900/20"
              />
              <span className="leading-tight">
                <span className="block text-sm font-black tracking-tight text-slate-900">
                  Study App
                </span>
                <span className="block text-[11px] font-medium uppercase tracking-[0.14em] text-slate-500">
                  Learner Workspace
                </span>
              </span>
            </Link>
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="relative z-[320] border border-slate-300/80 bg-white/90 text-slate-800 shadow-[0_8px_20px_-16px_rgba(15,23,42,0.9)] lg:hidden"
            onClick={() => setIsMobileNavOpen((current) => !current)}
            aria-label="Toggle mobile navigation"
          >
            {isMobileNavOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </header>

      <div className="mx-auto flex h-[calc(100dvh-var(--client-header-height,4rem))] w-full max-w-none lg:overflow-hidden">
        <div
          className={cn(
            "hidden shrink-0 border-r border-white/70 bg-white/50 transition-[width] duration-200 lg:block",
            isSidebarCollapsed ? "w-[88px]" : "w-[288px]",
          )}
        >
          <aside
            className={cn(
              "flex h-full min-h-0 flex-col overflow-x-hidden overflow-y-auto overscroll-contain [scrollbar-gutter:stable] border-r border-white/75 bg-gradient-to-b from-white/88 to-slate-50/85 pl-3 pr-2 py-4 backdrop-blur-xl",
              isSidebarCollapsed && "bg-gradient-to-b from-white/80 to-slate-100/70 px-1.5 py-3",
            )}
          >
            <div
              className={cn(
                "mb-3 flex items-center",
                isSidebarCollapsed ? "justify-center px-0.5" : "justify-between px-1",
              )}
            >
              {!isSidebarCollapsed ? (
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">
                    Workspace nav
                  </p>
                  <p className="mt-1 text-sm font-semibold text-slate-900">Study controls</p>
                </div>
              ) : null}
              <Button
                type="button"
                variant="outline"
                size="icon"
                className={cn(
                  "shrink-0 rounded-xl border-slate-300/80 bg-white/90 text-slate-700 shadow-[0_10px_24px_-18px_rgba(15,23,42,0.65)]",
                  isSidebarCollapsed ? "h-10 w-10" : "h-9 w-9",
                )}
                onClick={() => setIsSidebarCollapsed((current) => !current)}
                title={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              >
                {isSidebarCollapsed ? (
                  <ChevronsRight className="h-4 w-4" />
                ) : (
                  <ChevronsLeft className="h-4 w-4" />
                )}
              </Button>
            </div>

            <div className={cn("space-y-2.5", isSidebarCollapsed && "space-y-2")}>
              <DesktopNavSection
                title="Workspace"
                items={primaryNavItems}
                pathname={pathname}
                collapsed={isSidebarCollapsed}
              />
              <DesktopNavSection
                title="Account"
                items={accountNavItems}
                pathname={pathname}
                collapsed={isSidebarCollapsed}
              />
              {plannedNavItems.length > 0 ? (
                <DesktopNavSection
                  title="Coming up"
                  items={plannedNavItems}
                  pathname={pathname}
                  collapsed={isSidebarCollapsed}
                />
              ) : null}
            </div>

            <div
              className={cn(
                "mt-auto border-t border-slate-200/80 pt-4",
                isSidebarCollapsed ? "space-y-3" : "space-y-3",
              )}
            >
              {!isSidebarCollapsed ? (
                <p className="px-1 text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">
                  Utilities
                </p>
              ) : null}

              <div
                className={cn(
                  "gap-2",
                  isSidebarCollapsed
                    ? "flex flex-col"
                    : "space-y-2 rounded-2xl border border-white/75 bg-white/72 p-2 ring-1 ring-slate-900/5",
                )}
              >
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      className={cn(
                        "relative inline-flex rounded-2xl border border-slate-300/80 bg-white/92 shadow-[0_10px_20px_-12px_rgba(13,18,28,0.22)] outline-none ring-offset-2 transition hover:-translate-y-px focus-visible:ring-2 focus-visible:ring-slate-400",
                        isSidebarCollapsed
                          ? "h-11 w-11 items-center justify-center"
                          : "w-full items-center justify-between px-3 py-2.5 text-left",
                      )}
                      aria-label="Open notifications"
                    >
                      {isSidebarCollapsed ? (
                        <Bell className="h-4 w-4 text-slate-700" />
                      ) : (
                        <>
                          <span className="flex min-w-0 items-center gap-3">
                            <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
                              <Bell className="h-4 w-4" />
                            </span>
                            <span className="min-w-0">
                              <span className="block truncate text-sm font-semibold text-slate-900">
                                Notifications
                              </span>
                              <span className="block truncate text-[11px] text-slate-500">
                                Alerts and replies
                              </span>
                            </span>
                          </span>
                          <span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-600">
                            {desktopNotificationCount}
                          </span>
                        </>
                      )}
                      {desktopNotificationCount > 0 ? (
                        <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full bg-rose-500" />
                      ) : null}
                    </button>
                  </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align={isSidebarCollapsed ? "center" : "end"}
                      side="right"
                      className="w-72 border-slate-200 bg-white/95 backdrop-blur-xl"
                    >
                    <DropdownMenuLabel className="max-w-full">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="truncate text-sm font-semibold">Notifications</p>
                          <p className="truncate text-[11px] font-normal text-slate-500">
                            Support replies and account alerts.
                          </p>
                        </div>
                        <button
                          type="button"
                          className="text-[11px] font-semibold text-slate-500 transition hover:text-slate-900"
                        >
                          Mark all as read
                        </button>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <div className="space-y-2 p-2">
                      {notificationSummary?.supportConversation ? (
                        <button
                          type="button"
                          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-left transition hover:border-slate-300 hover:bg-slate-50"
                          onClick={() => {
                            void navigate({ to: userAppRoutes.support });
                          }}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-slate-900">
                                Support conversation
                              </p>
                              <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">
                                {notificationSummary.supportConversation.lastMessagePreview ||
                                  "Your support thread is ready."}
                              </p>
                            </div>
                            {notificationSummary.supportUnreadCount > 0 ? (
                              <span className="rounded-full bg-indigo-600 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-white">
                                {notificationSummary.supportUnreadCount}
                              </span>
                            ) : null}
                          </div>
                          <p className="mt-2 text-[11px] text-slate-500">
                            {notificationSummary.supportConversation.lastMessageAt
                              ? new Date(
                                  notificationSummary.supportConversation.lastMessageAt,
                                ).toLocaleString("en-US")
                              : "No activity yet"}
                          </p>
                        </button>
                      ) : null}

                      {notificationSummary?.hasPendingSubscriptionRequest ? (
                        <button
                          type="button"
                          className="w-full rounded-xl border border-amber-200 bg-amber-50 px-3 py-3 text-left transition hover:border-amber-300"
                          onClick={() => {
                            void navigate({ to: userAppRoutes.subscription });
                          }}
                        >
                          <p className="text-sm font-semibold text-amber-900">
                            Subscription request pending
                          </p>
                          <p className="mt-1 text-xs leading-5 text-amber-800">
                            Your latest upgrade request is still waiting for admin review.
                          </p>
                        </button>
                      ) : null}

                      {!notificationSummary ||
                      (!notificationSummary.supportConversation &&
                        !notificationSummary.hasPendingSubscriptionRequest) ? (
                        <div className="px-3 py-8 text-center">
                          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
                            <Bell className="h-5 w-5 text-slate-500" />
                          </div>
                          <p className="mt-3 text-sm font-semibold text-slate-900">
                            No notifications yet
                          </p>
                          <p className="mt-1 text-xs leading-5 text-slate-500">
                            Support replies, plan updates, and account alerts can live here.
                          </p>
                          <Button
                            variant="outline"
                            className="mt-4 bg-white"
                            onClick={() => {
                              void navigate({ to: userAppRoutes.support });
                            }}
                          >
                            <MessageSquareMore className="h-4 w-4" />
                            Open support
                          </Button>
                        </div>
                      ) : null}
                    </div>
                  </DropdownMenuContent>
                </DropdownMenu>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      className={cn(
                        "inline-flex items-center gap-3 rounded-2xl border border-slate-300/80 bg-white/92 shadow-[0_10px_20px_-12px_rgba(13,18,28,0.22)] outline-none ring-offset-2 transition hover:-translate-y-px focus-visible:ring-2 focus-visible:ring-slate-400",
                        isSidebarCollapsed ? "h-11 w-11 justify-center px-0" : "flex-1 px-2 py-1.5",
                      )}
                      aria-label="Open account menu"
                    >
                      <Avatar className="h-9 w-9">
                        <AvatarImage src={user?.image ?? undefined} alt={userDisplayName} />
                        <AvatarFallback>{userInitial}</AvatarFallback>
                      </Avatar>
                      {!isSidebarCollapsed ? (
                        <div className="min-w-0 flex-1 text-left">
                          <p className="truncate text-sm font-semibold text-slate-900">
                            {userDisplayName}
                          </p>
                          <p className="truncate text-[11px] text-slate-500">
                            {session?.expiresAt
                              ? `Session until ${new Date(session.expiresAt).toLocaleDateString("en-US")}`
                              : `${currentPlanName} plan`}
                          </p>
                        </div>
                      ) : null}
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align={isSidebarCollapsed ? "center" : "end"}
                    side="right"
                    className="w-56 border-slate-200 bg-white/95 backdrop-blur-xl"
                  >
                    <DropdownMenuLabel className="max-w-full">
                      <p className="truncate text-xs font-semibold">{userDisplayName}</p>
                      <p className="truncate text-[11px] font-normal text-slate-500">
                        {currentPlanName} plan
                      </p>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onSelect={() => void navigate({ to: userAppRoutes.profile })}>
                      <User2 className="h-4 w-4" />
                      Profile and devices
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onSelect={() => void navigate({ to: userAppRoutes.subscription })}
                    >
                      <CreditCard className="h-4 w-4" />
                      Compare plans
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => void navigate({ to: userAppRoutes.support })}>
                      <MessageSquareMore className="h-4 w-4" />
                      Support chat
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => void navigate({ to: userAppRoutes.settings })}>
                      <Settings className="h-4 w-4" />
                      Branding settings
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onSelect={() => void handleSwitchAccount()}>
                      <RefreshCcw className="h-4 w-4" />
                      Switch account
                    </DropdownMenuItem>
                    <DropdownMenuItem variant="destructive" onSelect={() => void handleSignOut()}>
                      <LogOut className="h-4 w-4" />
                      Sign out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {!isSidebarCollapsed ? (
                <div className="rounded-2xl border border-white/75 bg-white/68 px-3 py-3 ring-1 ring-slate-900/5">
                  <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">
                    Current plan
                  </p>
                  <div className="mt-2 flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{currentPlanName}</p>
                      <p className="text-[11px] text-slate-500">Workspace access summary</p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="bg-white"
                      onClick={() => {
                        void navigate({ to: userAppRoutes.subscription });
                      }}
                    >
                      Plans
                    </Button>
                  </div>
                </div>
              ) : null}
            </div>
          </aside>
        </div>

        <main className="relative z-0 min-w-0 flex-1 overflow-y-auto pb-10 lg:h-[calc(100dvh-var(--client-header-height,4rem))]">
          <div className="px-4 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
            <div key={pathname} className="route-transition">
              {children}
            </div>
          </div>
        </main>
      </div>

      {isMobileNavOpen ? (
        <div className="fixed inset-x-0 bottom-0 top-[var(--client-header-height,4rem)] z-[300] lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-slate-950/35 backdrop-blur-[2px]"
            aria-label="Close mobile navigation"
            onClick={() => setIsMobileNavOpen(false)}
          />
          <div className="absolute inset-x-0 top-0 max-h-full overflow-y-auto border-t border-white/60 bg-gradient-to-b from-white/96 to-slate-50/96 px-4 pb-6 pt-4 shadow-[0_30px_80px_-40px_rgba(15,23,42,0.55)]">
            <div className="mx-auto flex w-full max-w-3xl flex-col gap-4">
              <div className="rounded-3xl border border-white/80 bg-white/92 p-4 shadow-[0_18px_44px_-28px_rgba(15,23,42,0.45)] ring-1 ring-slate-900/5">
                <div className="flex items-center gap-3">
                  <img src={studyAppLogo} alt="Study App logo" className="h-11 w-11 rounded-2xl" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-black tracking-tight text-slate-900">
                      Study App
                    </p>
                    <p className="truncate text-xs uppercase tracking-[0.16em] text-slate-500">
                      Mobile workspace
                    </p>
                  </div>
                </div>
              </div>

              {mobileGroups.map((group) => (
                <section
                  key={group.title}
                  className="rounded-3xl border border-white/80 bg-white/92 p-4 shadow-[0_18px_44px_-28px_rgba(15,23,42,0.45)] ring-1 ring-slate-900/5"
                >
                  <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">
                    {group.title}
                  </p>
                  <div className="space-y-2">
                    {group.items.map((item) => (
                      <MobileNavLink
                        key={item.to}
                        item={item}
                        pathname={pathname}
                        onNavigate={() => setIsMobileNavOpen(false)}
                      />
                    ))}
                  </div>
                </section>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
