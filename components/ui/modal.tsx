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
  handleClassName,
  sheet = false,
  closeButtonPosition = "right",
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
  handleClassName?: string;
  sheet?: boolean;
  closeButtonPosition?: "left" | "right";
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
          "relative z-10 mx-auto flex w-full min-w-0 max-w-2xl flex-col overflow-hidden bg-card text-card-foreground",
          sheet
            ? "h-[100dvh] max-h-[100dvh] rounded-none pt-[env(safe-area-inset-top)] shadow-[0_-12px_48px_rgba(15,23,42,0.2)] sm:h-auto sm:max-h-[min(85dvh,100%)] sm:rounded-2xl sm:pt-0 sm:shadow-soft"
            : "max-h-[85dvh] rounded-t-2xl shadow-[0_-12px_48px_rgba(15,23,42,0.2)] sm:max-h-[min(85dvh,100%)] sm:rounded-2xl sm:shadow-soft",
          panelClassName,
        )}
      >
        <div className="flex shrink-0 justify-center pt-3 sm:hidden">
          <span
            className={cn(
              "mx-auto my-0.5 h-1.5 w-12 rounded-full bg-gray-300 dark:bg-neutral-600",
              handleClassName,
            )}
            aria-hidden="true"
          />
        </div>

        <div
          className={cn(
            "flex shrink-0 items-center gap-3 px-4 pb-2 pt-1 sm:px-5 sm:py-4 sm:pt-4",
            closeButtonPosition === "left" ? "justify-start" : "justify-between",
            headerClassName ?? "border-b border-slate-100 dark:border-slate-800",
          )}
        >
          {closeButtonPosition === "left" ? (
            <button
              type="button"
              onClick={onClose}
              aria-label="Kapat"
              className={cn(
                "rounded-full p-2 text-muted-foreground transition hover:bg-muted hover:text-foreground",
                closeButtonClassName,
              )}
            >
              <X className="size-5" />
            </button>
          ) : null}
          <h3
            id="modal-title"
            className={cn(
              "text-lg font-semibold text-foreground",
              closeButtonPosition === "left" && "flex-1 text-center",
              titleClassName,
            )}
          >
            {title}
          </h3>
          {closeButtonPosition === "left" ? (
            <span className="size-9" aria-hidden="true" />
          ) : (
            <button
              type="button"
              onClick={onClose}
              aria-label="Kapat"
              className={cn(
                "rounded-full p-2 text-muted-foreground transition hover:bg-muted hover:text-foreground",
                closeButtonClassName,
              )}
            >
              <X className="size-5" />
            </button>
          )}
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
          <div
            className={cn(
              "shrink-0 space-y-4 px-4 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:px-5",
              footerClassName ?? "border-t border-slate-100 dark:border-slate-800",
            )}
          >
            {footer}
          </div>
        ) : null}
      </div>
    </div>
  );
}
