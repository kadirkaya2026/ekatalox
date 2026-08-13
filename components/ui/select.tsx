import * as React from "react";
import { cn } from "@/lib/utils";

export const Select = React.forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement>
>(({ className, ...props }, ref) => {
  return (
    <select
      ref={ref}
      className={cn(
        "w-full rounded-lg border border-slate-200 bg-card px-4 py-3 text-sm text-foreground dark:border-slate-700",
        className,
      )}
      {...props}
    />
  );
});

Select.displayName = "Select";
