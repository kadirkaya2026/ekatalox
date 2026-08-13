import * as React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  asChild?: boolean;
  href?: string;
}

const variants: Record<ButtonVariant, string> = {
  primary:
    "bg-emerald-600 text-white hover:bg-emerald-700 disabled:bg-emerald-300",
  secondary:
    "border border-slate-200 bg-card text-foreground hover:bg-muted disabled:text-muted-foreground dark:border-slate-700 dark:hover:bg-slate-800",
  ghost: "bg-transparent text-foreground hover:bg-muted disabled:text-muted-foreground dark:hover:bg-slate-800",
  danger: "bg-rose-600 text-white hover:bg-rose-700 disabled:bg-rose-300",
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { asChild, className, href, variant = "primary", type = "button", ...props },
    ref,
  ) => {
    const classes = cn(
      "inline-flex items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-semibold transition disabled:cursor-not-allowed",
      variants[variant],
      className,
    );

    if (asChild && href) {
      return (
        <Link href={href} className={classes}>
          {props.children}
        </Link>
      );
    }

    return (
      <button
        ref={ref}
        type={type}
        className={classes}
        {...props}
      />
    );
  },
);

Button.displayName = "Button";