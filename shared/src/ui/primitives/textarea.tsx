import * as React from "react";
import { cn } from "../../utils/cn";

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "border-input placeholder:text-muted-foreground focus-visible:border-ring focus-visible:bg-white focus-visible:ring-ring/20 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-input/30 flex field-sizing-content min-h-24 w-full rounded-xl border bg-background/95 px-3.5 py-2.5 text-base shadow-[inset_0_1px_0_rgba(255,255,255,0.65)] transition-[color,background-color,box-shadow,border-color] duration-200 outline-none focus-visible:ring-[4px] disabled:cursor-not-allowed disabled:opacity-60 md:text-sm",
        className,
      )}
      {...props}
    />
  );
}

export { Textarea };
