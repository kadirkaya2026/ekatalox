import * as React from "react";
import { cn } from "@/lib/utils";

export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, ...props }, ref) => {
  return (
    <input
      ref={ref}
      className={cn(
        "w-full rounded-lg border border-slate-200 bg-card px-4 py-3 text-[16px] text-foreground placeholder:text-muted-foreground dark:border-slate-700",
        className,
      )}
      {...props}
    />
  );
});

Input.displayName = "Input";