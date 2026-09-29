import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

export function Card({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-ui="card"
      className={cn(
        "rounded-[var(--card-radius,0.75rem)] border border-[color:var(--card-line,#f1f5f9)] bg-card text-card-foreground shadow-[var(--card-shadow,0_1px_3px_0_rgb(0_0_0/0.1),0_1px_2px_-1px_rgb(0_0_0/0.1))] dark:border-slate-800",
        className,
      )}
      {...props}
    />
  );
}