import type { ComponentProps, ReactNode } from "react"
import { cn } from "@/lib/utils"

const toneClassName = {
  info: "border-slate-200 bg-slate-50 text-slate-700",
  success: "border-emerald-200 bg-emerald-50 text-emerald-700",
  warning: "border-amber-200 bg-amber-50 text-amber-800",
  error: "border-red-200 bg-red-50 text-red-700",
} as const

type NoticeTone = keyof typeof toneClassName

export function Notice({
  children,
  tone = "info",
  className,
  ...props
}: {
  children: ReactNode
  tone?: NoticeTone
  className?: string
} & ComponentProps<"div">) {
  return (
    <div
      role={tone === "error" ? "alert" : undefined}
      className={cn("rounded-lg border px-3 py-2 text-sm", toneClassName[tone], className)}
      {...props}
    >
      {children}
    </div>
  )
}
