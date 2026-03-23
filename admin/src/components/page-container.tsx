import type { ReactNode } from "react";
import { useRouterState } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import { resolveRoutePageSize, type PageSize } from "@/constants/page-size";

type PageContainerProps = {
  children: ReactNode;
  size?: PageSize;
  className?: string;
};

const sizeClassMap: Record<PageSize, string> = {
  narrow: "max-w-5xl",
  default: "max-w-[1400px]",
  wide: "max-w-[1520px]",
  full: "max-w-none",
};

export function PageContainer({
  children,
  size,
  className,
}: PageContainerProps) {
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });
  const resolvedSize = size ?? resolveRoutePageSize(pathname) ?? "default";

  return (
    <div
      className={cn(
        "mx-auto w-full px-4 py-4 sm:px-5 sm:py-6 md:px-6 md:py-7 xl:px-7",
        sizeClassMap[resolvedSize],
        className,
      )}
    >
      {children}
    </div>
  );
}

type PagePanelProps = {
  children: ReactNode;
  className?: string;
};

export function PagePanel({ children, className }: PagePanelProps) {
  return (
    <div
      className={cn(
        "space-y-4 rounded-2xl border border-white/65 bg-white/86 p-4 shadow-[0_18px_40px_-28px_rgba(15,23,42,0.5)] backdrop-blur-sm ring-1 ring-slate-900/6 md:p-6",
        className,
      )}
    >
      {children}
    </div>
  );
}
