import type { ComponentType, ReactNode } from "react"
import { cn } from "@/lib/utils"

type EmptyStateProps = {
  title: string
  description?: string
  icon?: ComponentType<{ className?: string }>
  action?: ReactNode
  className?: string
}

export function EmptyState({
  title,
  description,
  icon: Icon,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center",
        className,
      )}
    >
      {Icon ? (
        <span className="mx-auto mb-3 inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600">
          <Icon className="h-5 w-5" />
        </span>
      ) : null}
      <p className="text-sm font-semibold text-slate-900">{title}</p>
      {description ? <p className="mt-1 text-sm text-slate-500">{description}</p> : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  )
}
