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
        "space-y-4 rounded-[20px] border border-[#d8d4c9] bg-[#fffdf8] p-4 shadow-[0_16px_34px_-28px_rgba(32,35,33,0.24)] md:p-5",
        className,
      )}
    >
      {children}
    </div>
  );
}
