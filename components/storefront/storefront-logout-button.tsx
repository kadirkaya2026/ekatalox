"use client";

import { useTransition } from "react";
import { cn } from "@/lib/utils";

function getCartStorageKey(tenantId: string) {
  return `ekatalox_cart_${tenantId}`;
}

export function StorefrontLogoutButton({
  subdomain,
  tenantId,
  className,
}: {
  subdomain: string;
  tenantId: string;
  className?: string;
}) {
  const [pending, startTransition] = useTransition();

  function handleLogout() {
    startTransition(async () => {
      const response = await fetch("/api/storefront/logout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subdomain }),
      });

      if (!response.ok) {
        return;
      }

      try {
        window.localStorage.removeItem(getCartStorageKey(tenantId));
      } catch {
        // ignore storage errors
      }

      window.location.assign("/");
    });
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={pending}
      aria-label="Çıkış"
      className={cn(
        "shrink-0 rounded-lg px-2 py-1 text-xs font-semibold text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 disabled:opacity-50",
        className,
      )}
    >
      {pending ? "..." : "Çıkış"}
    </button>
  );
}
