import * as React from "react";
import { cn } from "@/lib/utils";

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => {
  return (
    <textarea
      ref={ref}
      className={cn(
        "min-h-28 w-full rounded-lg border border-slate-200 bg-card px-4 py-3 text-[16px] text-foreground placeholder:text-muted-foreground dark:border-slate-700",
        className,
      )}
      {...props}
    />
  );
});

Textarea.displayName = "Textarea";