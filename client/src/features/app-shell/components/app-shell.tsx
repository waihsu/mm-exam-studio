import { useEffect, useState, type ComponentType, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import {
  Bell,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Menu,
  MessageSquareMore,
  Settings,
  User2,
  X,
} from "lucide-react";
import studyAppLogo from "@/assets/brand-mark-compact.png";
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
import { accountNavItems, primaryNavItems, userAppRoutes } from "@/constants/routes";
import { useAuthFlow } from "@/features/auth/hooks/use-auth-flow";
import { workspaceApi } from "@/features/workspace/api/workspace-api";
import { cn } from "@/lib/utils";

type NavItem = {
  to: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
};

const PAGE_TITLES: Record<string, { crumb: string }> = {
  "/dashboard": { crumb: "Study space" },
  "/practice": { crumb: "Practice" },
  "/question-papers": { crumb: "Question papers" },
  "/profile": { crumb: "Account" },
  "/support": { crumb: "Account" },
  "/settings": { crumb: "Account" },
};

function getPageMeta(pathname: string) {
  const match = Object.entries(PAGE_TITLES)
    .sort(([left], [right]) => right.length - left.length)
    .find(([path]) => pathname === path || pathname.startsWith(`${path}/`));
  return match?.[1] ?? { crumb: "Learner space" };
}

function NavLinks({
  items,
  pathname,
  compact = false,
  collapsed = false,
  onNavigate,
}: {
  items: readonly NavItem[];
  pathname: string;
  compact?: boolean;
  collapsed?: boolean;
  onNavigate?: () => void;
}) {
  return (
    <div className={cn("space-y-1", compact && "flex items-center justify-around gap-1 space-y-0", collapsed && "space-y-1.5")}>
      {items.map((item) => {
        const Icon = item.icon;
        const active = pathname === item.to || pathname.startsWith(`${item.to}/`);
        return (
          <Link
            key={item.to}
            to={item.to}
            onClick={onNavigate}
            className={cn(
              "group flex items-center gap-3 rounded-xl font-medium transition",
              compact
                ? "min-w-0 flex-1 flex-col gap-1 px-2 py-2 text-[11px]"
                : collapsed
                  ? "mx-auto h-10 w-10 justify-center px-0 text-sm"
                  : "px-3 py-2.5 text-sm",
              active
                ? "bg-white text-slate-950 shadow-sm"
                : "text-slate-400 hover:bg-white/10 hover:text-white",
            )}
          >
            <Icon className={cn("h-4 w-4 shrink-0", active ? "text-indigo-600" : "text-slate-400")} />
            {!collapsed ? <span className="truncate">{item.label}</span> : null}
          </Link>
        );
      })}
    </div>
  );
}

function AccountMenu({
  userName,
  initial,
  image,
  onNavigate,
  onSignOut,
}: {
  userName: string;
  initial: string;
  image?: string | null;
  onNavigate: (to: string) => void;
  onSignOut: () => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white p-1.5 text-left shadow-sm transition hover:border-slate-300"
          aria-label="Open account menu"
        >
          <Avatar className="h-8 w-8">
            <AvatarImage src={image ?? undefined} alt={userName} />
            <AvatarFallback>{initial}</AvatarFallback>
          </Avatar>
          <span className="hidden max-w-32 pr-1 text-sm font-semibold text-slate-700 sm:block sm:truncate">
            {userName}
          </span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60">
        <DropdownMenuLabel>
          <p className="truncate text-sm">{userName}</p>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => onNavigate(userAppRoutes.profile)}>
          <User2 className="h-4 w-4" /> Profile
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => onNavigate(userAppRoutes.settings)}>
          <Settings className="h-4 w-4" /> Settings
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => onNavigate(userAppRoutes.support)}>
          <MessageSquareMore className="h-4 w-4" /> Support
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onSelect={onSignOut}>
          <LogOut className="h-4 w-4" /> Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, signOut } = useAuthFlow();
  const summaryQuery = useQuery({
    queryKey: ["workspace-summary", "app-shell"],
    queryFn: () => workspaceApi.getSummary(),
    staleTime: 60_000,
  });

  const page = getPageMeta(location.pathname);
  const userName = user?.name || user?.email || "Your account";
  const initial = (userName[0] ?? "U").toUpperCase();
  const unreadCount = summaryQuery.data?.ok ? summaryQuery.data.data.notifications.unreadCount : 0;
  const navigateTo = (to: string) => void navigate({ to });

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (
        event.target instanceof HTMLElement &&
        event.target.closest("input, textarea, [contenteditable='true'], [role='textbox']")
      ) {
        return;
      }

      if (event.key === "[") setCollapsed(true);
      if (event.key === "]") setCollapsed(false);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div className="min-h-[100dvh] bg-[#f7f8fa] text-slate-950">
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 hidden flex-col border-r border-slate-800 bg-slate-950 px-3 py-4 transition-[width] duration-200 lg:flex",
          collapsed ? "w-[88px]" : "w-[288px]",
        )}
      >
        <div className={cn("mb-7 flex items-center", collapsed ? "flex-col gap-3" : "justify-between px-2")}>
          <Link to={userAppRoutes.dashboard} className="flex items-center gap-3 overflow-hidden">
            <img src={studyAppLogo} alt="MM Exam Studio" className="h-9 w-9 shrink-0 rounded-xl" />
            {!collapsed ? (
              <span className="min-w-0">
                <span className="block truncate text-sm font-extrabold tracking-tight text-white">MM Exam Studio</span>
                <span className="mt-0.5 block text-xs font-medium text-slate-400">Learner space</span>
              </span>
            ) : null}
          </Link>
          <button
            type="button"
            onClick={() => setCollapsed((value) => !value)}
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-300 shadow-[0_10px_24px_-18px_rgba(15,23,42,0.9)] transition hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            aria-pressed={collapsed}
            title={collapsed ? "Expand sidebar (])" : "Collapse sidebar ([)"}
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        </div>

        {!collapsed ? <p className="mb-2 px-3 text-xs font-semibold text-slate-500">Study tools</p> : null}
        <NavLinks items={primaryNavItems} pathname={location.pathname} collapsed={collapsed} />

        {!collapsed ? <p className="mb-2 mt-8 px-3 text-xs font-semibold text-slate-500">Account</p> : null}
        <NavLinks items={accountNavItems} pathname={location.pathname} collapsed={collapsed} />

        <div className={cn("mt-auto", collapsed ? "flex justify-center" : "px-2")}>
          {!collapsed ? (
            <div className="rounded-xl border border-white/10 bg-white/5 p-3">
              <p className="text-xs font-semibold text-white">Open-source edition</p>
              <p className="mt-2 text-xs leading-5 text-slate-400">Every core study tool is available.</p>
            </div>
          ) : null}
        </div>
      </aside>

      <header className={cn("sticky top-0 z-30 h-16 border-b border-slate-200 bg-white/95 px-4 backdrop-blur lg:ml-[288px] lg:px-6", collapsed && "lg:ml-[88px]")}>
        <div className="mx-auto flex h-full max-w-[1440px] items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setMobileMenuOpen(true)} aria-label="Open navigation">
              <Menu className="h-5 w-5" />
            </Button>
            <p className="truncate text-sm font-semibold text-slate-500">
              <span className="font-bold text-[#202536]">MM Exam Studio</span>
              <span className="mx-2 text-slate-400">/</span>
              {page.crumb}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="relative text-slate-600" onClick={() => navigateTo(userAppRoutes.support)} aria-label="Open notifications">
              <Bell className="h-5 w-5" />
              {unreadCount > 0 ? <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-rose-500" /> : null}
            </Button>
            <AccountMenu userName={userName} initial={initial} image={user?.image} onNavigate={navigateTo} onSignOut={() => void signOut().then((result) => result.ok && navigateTo("/signin"))} />
          </div>
        </div>
      </header>

      <main className={cn("min-h-[calc(100dvh-4rem)] pb-20 lg:ml-[288px] lg:pb-0", collapsed && "lg:ml-[88px]")}>
        <div className="mx-auto max-w-[1440px] px-4 py-6 sm:px-6 lg:px-6 lg:py-7 xl:px-8 xl:py-8">
          <div key={location.pathname} className="route-transition">{children}</div>
        </div>
      </main>

      {mobileMenuOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button type="button" className="absolute inset-0 bg-slate-950/55" onClick={() => setMobileMenuOpen(false)} aria-label="Close navigation" />
          <aside className="relative flex h-full w-[min(300px,86vw)] flex-col bg-[#121827] px-4 py-5 shadow-2xl">
            <div className="mb-8 flex items-center justify-between">
              <Link to={userAppRoutes.dashboard} onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3">
                <img src={studyAppLogo} alt="MM Exam Studio" className="h-9 w-9 rounded-xl" />
                <span className="text-sm font-extrabold text-white">MM Exam Studio</span>
              </Link>
              <Button variant="ghost" size="icon" className="text-slate-300 hover:bg-white/10 hover:text-white" onClick={() => setMobileMenuOpen(false)} aria-label="Close navigation"><X className="h-5 w-5" /></Button>
            </div>
            <p className="mb-2 px-3 text-xs font-semibold text-slate-500">Study tools</p>
            <NavLinks items={primaryNavItems} pathname={location.pathname} onNavigate={() => setMobileMenuOpen(false)} />
            <p className="mb-2 mt-7 px-3 text-xs font-semibold text-slate-500">Account</p>
            <NavLinks items={accountNavItems} pathname={location.pathname} onNavigate={() => setMobileMenuOpen(false)} />
          </aside>
        </div>
      ) : null}

      <nav className="print:hidden fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/95 px-2 pb-[env(safe-area-inset-bottom)] pt-1 backdrop-blur lg:hidden">
        <NavLinks items={primaryNavItems} pathname={location.pathname} compact />
      </nav>
    </div>
  );
}
