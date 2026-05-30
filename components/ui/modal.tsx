"use client";

import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  contentScroll = true,
  bodyClassName,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  contentScroll?: boolean;
  bodyClassName?: string;
}) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/40 p-4 backdrop-blur-sm sm:items-center">
      <div
        className={cn(
          "mx-auto flex max-h-[85dvh] w-full min-w-0 max-w-2xl flex-col overflow-hidden",
          "rounded-t-2xl bg-white shadow-[0_-12px_48px_rgba(15,23,42,0.2)]",
          "sm:max-h-[min(85dvh,100%)] sm:rounded-2xl sm:shadow-soft",
        )}
      >
        <div className="flex shrink-0 justify-center pt-3 sm:hidden">
          <span
            className="mx-auto my-0.5 h-1.5 w-12 rounded-full bg-gray-300"
            aria-hidden="true"
          />
        </div>

        <div className="flex shrink-0 items-center justify-between border-b border-slate-100 px-4 pb-2 pt-1 sm:px-5 sm:py-4 sm:pt-4">
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

        <div
          className={cn(
            "min-w-0 max-w-full flex-1 overflow-x-hidden px-4 py-4 sm:p-5",
            contentScroll
              ? "overflow-y-auto"
              : "flex min-h-0 flex-col overflow-hidden",
            bodyClassName,
          )}
        >
          {children}
        </div>

        {footer ? (
          <div className="shrink-0 space-y-4 border-t border-slate-100 px-4 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:px-5">
            {footer}
          </div>
        ) : null}
      </div>
    </div>
  );
}
