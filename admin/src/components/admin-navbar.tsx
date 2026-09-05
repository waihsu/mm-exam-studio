import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  BookText,
  ExternalLink,
  Layers3,
  LifeBuoy,
  LogOut,
  LayoutDashboard,
  Menu,
  Settings,
  ShieldCheck,
  UsersRound,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  ADMIN_ROUTES,
  ADMIN_SIDEBAR_NAV_GROUPS,
  type AdminNavItem,
} from "@/constants/routes";
import { useAuthFlow } from "@/features/auth/hooks/use-auth-flow";
import { useLanguage } from "@/i18n";
import adminLogo from "@/assets/brand-mark-compact.png";
import { cn } from "@/lib/utils";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";

type AdminNavbarProps = {
  isSidebarCollapsed?: boolean;
  onToggleSidebar?: () => void;
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
  if (to === ADMIN_ROUTES.taxonomy || to.startsWith("/taxonomy"))
    return Layers3;
  if (to === ADMIN_ROUTES.userSupport) return LifeBuoy;
  if (to === ADMIN_ROUTES.users) return UsersRound;
  if (to === ADMIN_ROUTES.settings || to.startsWith("/settings"))
    return Settings;
  return ShieldCheck;
};

const renderMobileNavLink = (
  item: AdminNavItem,
  pathname: string,
  tr: (value: { en: string; my: string }) => string,
  onNavigate: () => void,
) => {
  const isActive = isActivePath(pathname, item.to);
  const ItemIcon = iconForRoute(item.to);
  const label = tr(item.label);

  return (
    <Link
      key={`${item.to}-${label}`}
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
        <ItemIcon className="h-4 w-4 shrink-0" />
        <span className="truncate">{label}</span>
      </span>
      {isActive ? (
        <span className="h-2 w-2 rounded-full bg-indigo-700" />
      ) : null}
    </Link>
  );
};

export function AdminNavbar({
  isSidebarCollapsed = false,
  onToggleSidebar,
}: AdminNavbarProps) {
  void isSidebarCollapsed;
  void onToggleSidebar;
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const mobileMenuButtonRef = useRef<HTMLButtonElement | null>(null);
  const previousFocusedElementRef = useRef<HTMLElement | null>(null);
  const navigate = useNavigate();
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });
  const { user, signOut, isAdmin, isSuperAdmin } = useAuthFlow();
  const { language, toggleLanguage, tr } = useLanguage();
  const isSignedIn = Boolean(user);
  const studyAppUrl = (
    import.meta.env.VITE_STUDY_APP_URL ?? "http://localhost:5173"
  )
    .trim()
    .replace(/\/+$/, "");

  useEffect(() => {
    setIsMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (typeof document === "undefined") return;
    document.body.style.overflow = isMobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMobileOpen]);

  useEffect(() => {
    if (!isMobileOpen || typeof document === "undefined") return;

    previousFocusedElementRef.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;

    const panel = document.getElementById("admin-mobile-nav-panel");
    const firstFocusable = panel?.querySelector<HTMLElement>(
      'a[href],button:not([disabled]),[tabindex]:not([tabindex="-1"])',
    );
    firstFocusable?.focus();

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setIsMobileOpen(false);
    };

    const fallback = mobileMenuButtonRef.current;
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("keydown", handleEscape);
      (previousFocusedElementRef.current ?? fallback)?.focus();
    };
  }, [isMobileOpen]);

  const handleSignOut = async () => {
    const success = await signOut();
    if (!success) return;
    setIsMobileOpen(false);
    await navigate({ to: ADMIN_ROUTES.signIn });
  };

  const userDisplayName =
    user?.name?.trim() ||
    user?.email ||
    tr({ en: "Admin User", my: "အက်မင် အသုံးပြုသူ" });
  const userInitial = (userDisplayName[0] ?? "U").toUpperCase();
  const userImage = user?.image ?? undefined;
  const visibleGroups = ADMIN_SIDEBAR_NAV_GROUPS.map((group) => ({
    ...group,
    items: group.items.filter(
      (item) =>
        (!item.adminOnly || isAdmin) && (!item.superadminOnly || isSuperAdmin),
    ),
  })).filter((group) => group.items.length > 0);

  return (
    <>
      <header className="sticky top-0 z-[180] min-h-[var(--admin-header-height,4rem)] border-b border-slate-200 bg-white/95 backdrop-blur-xl">
        <div className="mx-auto flex h-[var(--admin-header-height,4rem)] w-full max-w-none items-center justify-between gap-3 px-3 md:px-4 lg:px-6">
        <div className="flex min-w-0 items-center gap-2">
          <Link
            to={ADMIN_ROUTES.dashboard}
            className="group inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-1.5 transition hover:bg-slate-50"
          >
            <img
              src={adminLogo}
              alt="Study Admin logo"
              className="h-8 w-8 rounded-xl shadow-sm shadow-indigo-900/20"
            />
            <span className="leading-tight">
              <span className="block text-sm font-black tracking-tight text-slate-900">
                Study Admin
              </span>
              <span className="block text-[11px] font-medium uppercase tracking-[0.14em] text-slate-500">
                Route Groups
              </span>
            </span>
          </Link>
        </div>

        <div className="hidden items-center gap-2 lg:flex">
          <Button
            type="button"
            variant="outline"
            className="h-9 rounded-xl border-slate-300/80 bg-white/88 px-3 text-slate-700"
            onClick={toggleLanguage}
          >
            {language === "en" ? "MM" : "EN"}
          </Button>
          <a
            href={studyAppUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-slate-300/75 bg-white/88 px-3 text-sm font-semibold text-slate-700 transition hover:bg-white"
          >
            {tr({ en: "Study App", my: "လေ့လာရေး App" })}
            <ExternalLink className="h-3.5 w-3.5" />
          </a>

          {isSignedIn ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="h-9 w-9 cursor-pointer rounded-full border border-border/80 bg-white/90 shadow-[0_10px_20px_-12px_rgba(13,18,28,0.28)] outline-none ring-offset-2 transition hover:-translate-y-px focus-visible:ring-2 focus-visible:ring-slate-400"
                  aria-label={tr({
                    en: "Open user menu",
                    my: "အသုံးပြုသူ မီနူးဖွင့်မည်",
                  })}
                >
                  <Avatar className="h-full w-full">
                    <AvatarImage src={userImage} alt={userDisplayName} />
                    <AvatarFallback>{userInitial}</AvatarFallback>
                  </Avatar>
                </button>
              </DropdownMenuTrigger>

              <DropdownMenuContent
                align="end"
                className="w-44 border-border/80 bg-card/95 backdrop-blur-xl ring-1 ring-slate-900/8"
              >
                <DropdownMenuLabel className="max-w-full">
                  <p className="truncate text-xs font-semibold">
                    {userDisplayName}
                  </p>
                  {user?.email ? (
                    <p className="truncate text-[11px] font-normal text-slate-500">
                      {user.email}
                    </p>
                  ) : null}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} variant="destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  {tr({ en: "Sign out", my: "ထွက်မည်" })}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button
              asChild
              variant="outline"
              className="border-border/80 bg-card/80 text-foreground/80"
            >
              <Link to={ADMIN_ROUTES.signIn}>Sign in</Link>
            </Button>
          )}
        </div>

        <Button
          ref={mobileMenuButtonRef}
          type="button"
          variant="ghost"
          size="icon"
          className="relative z-[320] border border-slate-300/80 bg-white/90 text-slate-800 shadow-[0_8px_20px_-16px_rgba(15,23,42,0.9)] lg:hidden"
          onClick={() => setIsMobileOpen((current) => !current)}
          aria-label="Toggle mobile navigation"
          aria-expanded={isMobileOpen}
          aria-controls="admin-mobile-nav-panel"
        >
          {isMobileOpen ? (
            <X className="h-5 w-5" />
          ) : (
            <Menu className="h-5 w-5" />
          )}
        </Button>
        </div>
      </header>

      {isMobileOpen ? (
        <div className="fixed inset-x-0 bottom-0 top-[var(--admin-header-height,4rem)] z-[300] lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-slate-950/35 backdrop-blur-[2px]"
            aria-label="Close mobile navigation"
            onClick={() => setIsMobileOpen(false)}
          />
          <div
            id="admin-mobile-nav-panel"
            className="absolute inset-x-0 top-0 max-h-full overflow-y-auto border-t border-white/60 bg-gradient-to-b from-white/96 to-slate-50/96 px-4 pb-6 pt-4 shadow-[0_30px_80px_-40px_rgba(15,23,42,0.55)]"
          >
            <div className="mx-auto flex w-full max-w-3xl flex-col gap-4">
              <div className="rounded-3xl border border-white/80 bg-white/92 p-4 shadow-[0_18px_44px_-28px_rgba(15,23,42,0.45)] ring-1 ring-slate-900/5">
                <div className="flex items-center gap-3">
                  <img
                    src={adminLogo}
                    alt="Study Admin logo"
                    className="h-11 w-11 rounded-2xl"
                  />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-black tracking-tight text-slate-900">
                      Study Admin
                    </p>
                    <p className="truncate text-xs uppercase tracking-[0.16em] text-slate-500">
                      Mobile workspace
                    </p>
                  </div>
                </div>

                <div className="mt-4 grid gap-2 sm:grid-cols-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="justify-start border-slate-300/80 bg-white"
                    onClick={() => {
                      toggleLanguage();
                    }}
                  >
                    {language === "en" ? "MM" : "EN"}
                  </Button>
                  <a
                    href={studyAppUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-start gap-2 rounded-xl border border-slate-300/80 bg-white px-3 py-2 text-sm font-semibold text-slate-700"
                  >
                    {tr({ en: "Study App", my: "လေ့လာရေး App" })}
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </div>
              </div>

              {visibleGroups.map((group) => (
                <section
                  key={group.id}
                  className="rounded-3xl border border-white/80 bg-white/92 p-4 shadow-[0_18px_44px_-28px_rgba(15,23,42,0.45)] ring-1 ring-slate-900/5"
                >
                  <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">
                    {tr(group.label)}
                  </p>
                  <div className="space-y-2">
                    {group.items.map((item) =>
                      renderMobileNavLink(item, pathname, tr, () => {
                        setIsMobileOpen(false);
                      }),
                    )}
                  </div>
                </section>
              ))}

              {isSignedIn ? (
                <section className="rounded-3xl border border-white/80 bg-white/92 p-4 shadow-[0_18px_44px_-28px_rgba(15,23,42,0.45)] ring-1 ring-slate-900/5">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-11 w-11">
                      <AvatarImage src={userImage} alt={userDisplayName} />
                      <AvatarFallback>{userInitial}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-900">
                        {userDisplayName}
                      </p>
                      {user?.email ? (
                        <p className="truncate text-xs text-slate-500">
                          {user.email}
                        </p>
                      ) : null}
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    className="mt-4 w-full justify-center border-red-200 bg-white text-red-600 hover:text-red-700"
                    onClick={() => {
                      void handleSignOut();
                    }}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    {tr({ en: "Sign out", my: "ထွက်မည်" })}
                  </Button>
                </section>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
