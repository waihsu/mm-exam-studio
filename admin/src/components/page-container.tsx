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
        "mx-auto w-full px-4 py-5 sm:px-5 sm:py-6 md:px-6 md:py-7 xl:px-8",
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
        "space-y-4 rounded-xl border border-slate-200/90 bg-white p-4 shadow-[0_10px_28px_-24px_rgba(15,23,42,0.42)] md:p-5",
        className,
      )}
    >
      {children}
    </div>
  );
}
