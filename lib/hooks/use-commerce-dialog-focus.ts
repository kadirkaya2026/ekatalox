"use client";
import { useEffect, useRef, type RefObject } from "react";

/** Keyboard containment for the custom storefront's order dialogs. */
export function useCommerceDialogFocus(open: boolean, enabled: boolean, panel: RefObject<HTMLDivElement | null>, onClose: () => void) {
  const close = useRef(onClose);
  useEffect(() => { close.current = onClose; }, [onClose]);
  useEffect(() => {
    if (!open || !enabled) return;
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const controls = () => Array.from(panel.current?.querySelectorAll<HTMLElement>('button:not(:disabled),a[href],input:not(:disabled),select:not(:disabled),textarea:not(:disabled),[tabindex="0"]') ?? []).filter(el => el.getClientRects().length > 0 && !el.closest('[inert]'));
    const frame = requestAnimationFrame(() => (controls()[0] ?? panel.current)?.focus({ preventScroll: true }));
    function keydown(event: KeyboardEvent) {
      if (event.key === "Escape") { event.preventDefault(); event.stopPropagation(); close.current(); return; }
      if (event.key !== "Tab") return;
      const items = controls();
      if (!items.length) { event.preventDefault(); panel.current?.focus(); return; }
      const first = items[0], last = items[items.length - 1];
      if (event.shiftKey && (document.activeElement === first || !panel.current?.contains(document.activeElement))) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && (document.activeElement === last || !panel.current?.contains(document.activeElement))) { event.preventDefault(); first.focus(); }
    }
    document.addEventListener("keydown", keydown, true);
    return () => { cancelAnimationFrame(frame); document.removeEventListener("keydown", keydown, true); if (previous?.isConnected) previous.focus({ preventScroll: true }); };
  }, [open, enabled, panel]);
}
