import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-xl border border-slate-100 bg-card text-card-foreground shadow-sm dark:border-slate-800",
        className,
      )}
      {...props}
    />
  );
}