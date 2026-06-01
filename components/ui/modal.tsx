"use client";

import { X } from "lucide-react";
import { useBodyScrollLock } from "@/lib/hooks/use-body-scroll-lock";
import { cn } from "@/lib/utils";

export function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  contentScroll = true,
  bodyClassName,
  panelClassName,
  overlayClassName,
  headerClassName,
  titleClassName,
  closeButtonClassName,
  footerClassName,
  sheet = false,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  contentScroll?: boolean;
  bodyClassName?: string;
  panelClassName?: string;
  overlayClassName?: string;
  headerClassName?: string;
  titleClassName?: string;
  closeButtonClassName?: string;
  footerClassName?: string;
  sheet?: boolean;
}) {
  useBodyScrollLock(open);

  if (!open) {
    return null;
  }

  return (
    <div
      className={cn(
        "fixed inset-0 z-[60] flex items-end justify-center bg-black/40 backdrop-blur-sm sm:items-center",
        sheet ? "p-0 sm:p-4" : "p-4",
        overlayClassName,
      )}
    >
      <button
        type="button"
        aria-label="Modalı kapat"
        className="absolute inset-0 touch-none"
        onClick={onClose}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        onClick={(event) => event.stopPropagation()}
        className={cn(
          "relative z-10 mx-auto flex w-full min-w-0 max-w-2xl flex-col overflow-hidden bg-white",
          sheet
            ? "h-[100dvh] max-h-[100dvh] rounded-none pt-[env(safe-area-inset-top)] shadow-[0_-12px_48px_rgba(15,23,42,0.2)] sm:h-auto sm:max-h-[min(85dvh,100%)] sm:rounded-2xl sm:pt-0 sm:shadow-soft"
            : "max-h-[85dvh] rounded-t-2xl shadow-[0_-12px_48px_rgba(15,23,42,0.2)] sm:max-h-[min(85dvh,100%)] sm:rounded-2xl sm:shadow-soft",
          panelClassName,
        )}
      >
        <div className="flex shrink-0 justify-center pt-3 sm:hidden">
          <span
            className="mx-auto my-0.5 h-1.5 w-12 rounded-full bg-gray-300"
            aria-hidden="true"
          />
        </div>

        <div className={cn("flex shrink-0 items-center justify-between border-b border-slate-100 px-4 pb-2 pt-1 sm:px-5 sm:py-4 sm:pt-4", headerClassName)}>
          <h3 id="modal-title" className={cn("text-lg font-semibold text-slate-900", titleClassName)}>
            {title}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className={cn(
              "rounded-full p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900",
              closeButtonClassName,
            )}
          >
            <X className="size-5" />
          </button>
        </div>

        <div
          className={cn(
            "min-w-0 max-w-full flex-1 overflow-x-hidden px-4 py-4 sm:p-5",
            contentScroll
              ? "overflow-y-auto overscroll-y-contain"
              : "flex min-h-0 flex-col overflow-hidden",
            bodyClassName,
          )}
        >
          {children}
        </div>

        {footer ? (
          <div className={cn("shrink-0 space-y-4 border-t border-slate-100 px-4 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:px-5", footerClassName)}>
            {footer}
          </div>
        ) : null}
      </div>
    </div>
  );
}
