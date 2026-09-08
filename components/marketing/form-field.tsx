// Pazarlama formlarının ortak alan sarmalayıcısı (başvuru, iletişim).
// Hook yok; sunucu ve istemci bileşenlerinden kullanılabilir.
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export const fieldInputClass =
  "border-brand-line bg-white text-brand-ink placeholder:text-brand-muted/70 focus:border-brand-navy focus:outline-none focus:ring-2 focus:ring-brand-green/25 aria-[invalid=true]:border-red-600";

export function Field({
  id,
  label,
  hint,
  error,
  optional,
  children,
  className,
}: {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  optional?: boolean;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <label htmlFor={id} className="block text-sm font-semibold text-brand-ink">
        {label}
        {optional ? <span className="ml-1 font-normal text-brand-muted">(isteğe bağlı)</span> : null}
      </label>
      <div className="mt-1.5">{children}</div>
      {error ? (
        <p id={`${id}-error`} className="mt-1.5 text-sm text-red-700" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="mt-1.5 text-sm text-brand-muted">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

export function FormAlert({ tone, children, className }: { tone: "error" | "success" | "info"; children: ReactNode; className?: string }) {
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={cn(
        "rounded-md border px-4 py-3 text-sm leading-relaxed",
        tone === "error" && "border-red-200 bg-red-50 text-red-800",
        tone === "success" && "border-brand-green/30 bg-brand-green-soft text-brand-green",
        tone === "info" && "border-brand-line bg-brand-paper text-brand-ink",
        className,
      )}
    >
      {children}
    </div>
  );
}
