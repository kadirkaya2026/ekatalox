"use client";

import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export function Modal({
  open,
  onClose,
  title,
  children,
  footer,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-slate-900/40 p-0 sm:items-center sm:p-4">
      <div className="mx-auto flex max-h-[85dvh] w-full min-w-0 max-w-2xl flex-col rounded-t-[1.75rem] bg-white shadow-soft sm:max-h-[min(85dvh,100%)] sm:rounded-2xl">
        <div className="flex shrink-0 items-center justify-between border-b border-slate-100 px-4 py-4 sm:px-5">
          <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className={cn(
              "rounded-full p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900",
            )}
          >
            <X className="size-5" />
          </button>
        </div>
        <div className="flex-1 overflow-x-hidden overflow-y-auto p-4 sm:p-5">{children}</div>
        {footer ? (
          <div className="shrink-0 border-t border-slate-100 px-4 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:px-5">
            {footer}
          </div>
        ) : null}
      </div>
    </div>
  );
}
