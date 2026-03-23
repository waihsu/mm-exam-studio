import { useEffect, useState } from "react";
import { Outlet } from "@tanstack/react-router";
import { AdminBreadcrumbs } from "@/components/admin-breadcrumbs";
import { AdminNavbar } from "@/components/admin-navbar";
import { AdminSidebar } from "@/components/admin-sidebar";
import { cn } from "@/lib/utils";

export function AdminShell() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "[") {
        setIsSidebarCollapsed(true);
      }
      if (event.key === "]") {
        setIsSidebarCollapsed(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  return (
    <div className="relative isolate min-h-screen">
      <AdminNavbar
        isSidebarCollapsed={isSidebarCollapsed}
        onToggleSidebar={() =>
          setIsSidebarCollapsed((current) => !current)
        }
      />
      <div className="mx-auto flex min-h-[calc(100vh-var(--admin-header-height,4rem))] w-full max-w-none lg:h-[calc(100vh-var(--admin-header-height,4rem))] lg:overflow-hidden">
        <div
          className={cn(
            "hidden shrink-0 border-r border-white/70 bg-white/50 transition-[width] duration-200 lg:block",
            isSidebarCollapsed ? "w-[88px]" : "w-[288px]",
          )}
        >
          <div className="h-[calc(100vh-var(--admin-header-height,4rem))]">
            <AdminSidebar collapsed={isSidebarCollapsed} className="h-full" />
          </div>
        </div>
        <main className="relative z-0 min-w-0 flex-1 pb-10 lg:h-[calc(100vh-var(--admin-header-height,4rem))] lg:overflow-y-auto">
          <AdminBreadcrumbs />
          <Outlet />
        </main>
      </div>
    </div>
  );
}
