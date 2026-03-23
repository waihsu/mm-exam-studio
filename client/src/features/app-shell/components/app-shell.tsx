import { useState, type ComponentType, type ReactNode } from "react";
import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { Menu, LogOut, RefreshCcw, X } from "lucide-react";
import studyAppLogo from "@/assets/study-app-logo.svg";
import { Button } from "@/components/ui/button";
import { accountNavItems, plannedNavItems, primaryNavItems } from "@/constants/routes";
import { useAuthFlow } from "@/features/auth/hooks/use-auth-flow";

function NavSection({
  title,
  items,
  pathname,
  onSelect,
}: {
  title: string;
  items: ReadonlyArray<{
    to: string;
    label: string;
    icon: ComponentType<{ className?: string }>;
    status: "live" | "planned";
  }>;
  pathname: string;
  onSelect?: () => void;
}) {
  return (
    <div className="space-y-2.5">
      <p className="px-1 text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">
        {title}
      </p>
      <div className="space-y-2">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.to || pathname.startsWith(`${item.to}/`);

          return (
            <Link
              key={item.to}
              to={item.to}
              onClick={onSelect}
              className={`hover-lift flex items-center gap-3 rounded-lg border px-3.5 py-3 transition ${
                isActive
                  ? "border-slate-800 bg-slate-900 text-white shadow-[0_14px_28px_-22px_rgba(15,23,42,0.8)]"
                  : "border-slate-200 bg-white/90 text-slate-800 hover:border-slate-300 hover:bg-white"
              }`}
            >
              <div
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-md ${
                  isActive ? "bg-white/20 text-white" : "border border-slate-200 bg-slate-50"
                }`}
              >
                <Icon className={`h-4 w-4 ${isActive ? "text-white" : "text-slate-600"}`} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="truncate text-sm font-semibold">{item.label}</p>
                  {item.status === "planned" ? (
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.16em] ${
                        isActive
                          ? "bg-white/20 text-white"
                          : "bg-amber-100 text-amber-900"
                      }`}
                    >
                      Next
                    </span>
                  ) : null}
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const { user, session, signOut } = useAuthFlow();

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

  const nav = (
    <div className="flex h-full min-h-0 flex-col">
      <div className="space-y-4">
        <div className="flex items-center gap-3 px-1">
          <img src={studyAppLogo} alt="MM Exam Studio" className="h-10 w-10" />
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">
              Workspace
            </p>
            <h1 className="text-lg font-semibold tracking-tight text-slate-900">
              MM Exam Studio
            </h1>
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white/95 p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-slate-900">
                {user?.name || user?.email || "Signed-in account"}
              </p>
              <p className="mt-1 text-xs font-medium text-slate-500">
                {session?.expiresAt ? "Signed in" : "Active session"}
              </p>
            </div>
            <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-semibold text-slate-700">
              Active
            </span>
          </div>
        </div>
      </div>

      <div className="mt-5 min-h-0 flex-1 overflow-y-auto pr-1">
        <div className="stagger-children space-y-6">
          <NavSection
            title="Workspace"
            items={primaryNavItems}
            pathname={location.pathname}
            onSelect={() => setIsMobileNavOpen(false)}
          />

          <NavSection
            title="Account"
            items={accountNavItems}
            pathname={location.pathname}
            onSelect={() => setIsMobileNavOpen(false)}
          />

          {plannedNavItems.length > 0 ? (
            <NavSection
              title="Coming up"
              items={plannedNavItems}
              pathname={location.pathname}
              onSelect={() => setIsMobileNavOpen(false)}
            />
          ) : null}
        </div>
      </div>

      <div className="mt-5 border-t border-slate-200 pt-5">
        <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-semibold text-slate-900">Session</p>
            <p className="text-xs font-medium text-slate-500">
              {session?.expiresAt
                ? new Date(session.expiresAt).toLocaleDateString("en-US")
                : "Now"}
            </p>
          </div>
          <Button
            variant="outline"
            className="w-full bg-white"
            onClick={() => void handleSwitchAccount()}
          >
            <RefreshCcw className="h-4 w-4" />
            Switch account
          </Button>
          <Button
            variant="outline"
            className="w-full bg-white"
            onClick={() => void handleSignOut()}
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="relative min-h-screen bg-transparent text-slate-900">
      <div className="flex min-h-screen w-full">
        <aside className="hidden w-[324px] shrink-0 border-r border-slate-200/80 bg-white/55 backdrop-blur-sm lg:block">
          <div className="sticky top-0 h-screen p-5">
            <div className="h-full overflow-hidden rounded-2xl border border-slate-200 bg-white/92 p-5">
              {nav}
            </div>
          </div>
        </aside>

        <div className="flex min-h-screen min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-20 flex items-center justify-between border-b border-slate-200/80 bg-white/90 px-3 py-3 backdrop-blur-sm sm:px-5 lg:hidden">
            <div className="flex items-center gap-3">
              <img src={studyAppLogo} alt="MM Exam Studio" className="h-10 w-10" />
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
                  User App
                </p>
                <h1 className="text-sm font-semibold text-slate-900 sm:text-base">MM Exam Studio</h1>
              </div>
            </div>
            <Button variant="outline" size="icon" className="bg-white" onClick={() => setIsMobileNavOpen(true)}>
              <Menu className="h-5 w-5" />
              <span className="sr-only">Open navigation</span>
            </Button>
          </header>

          {isMobileNavOpen ? (
            <div className="fixed inset-0 z-[120] lg:hidden">
              <button
                type="button"
                className="absolute inset-0 bg-slate-950/40"
                onClick={() => setIsMobileNavOpen(false)}
                aria-label="Close navigation"
              />
              <div className="absolute right-0 top-0 h-full w-[92vw] max-w-[360px] overflow-y-auto border-l border-slate-200 bg-white/96 p-5 pb-[max(env(safe-area-inset-bottom),1rem)] shadow-xl backdrop-blur-sm">
                <div className="mb-4 flex items-center justify-between">
                  <p className="text-sm font-bold uppercase tracking-[0.16em] text-slate-500">
                    Navigation
                  </p>
                  <Button variant="outline" size="icon" className="bg-white" onClick={() => setIsMobileNavOpen(false)}>
                    <X className="h-5 w-5" />
                    <span className="sr-only">Close navigation</span>
                  </Button>
                </div>
                {nav}
              </div>
            </div>
          ) : null}

          <main className="min-w-0 flex-1 px-4 py-4 sm:px-6 sm:py-6 lg:h-screen lg:overflow-y-auto lg:px-8 lg:py-8">
            <div key={location.pathname} className="route-transition">
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
