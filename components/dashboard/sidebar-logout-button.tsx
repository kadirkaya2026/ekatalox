"use client";

import { LogOut } from "lucide-react";
import { useTransition } from "react";
import { appEnv } from "@/lib/env";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

function getLoginUrl(mode: "admin" | "tenant") {
  const next = mode === "admin" ? "admin" : "app";
  const path = `/login?next=${next}`;

  if (typeof window === "undefined") {
    return path;
  }

  const isLocalhost =
    window.location.hostname === "localhost" ||
    window.location.hostname.endsWith(".localhost");

  if (isLocalhost) {
    return path;
  }

  return `https://${appEnv.marketingDomain}${path}`;
}

export function SidebarLogoutButton({
  mode,
}: {
  mode: "admin" | "tenant";
}) {
  const [pending, startTransition] = useTransition();
  const supabase = createSupabaseBrowserClient();

  function handleLogout() {
    startTransition(async () => {
      if (supabase) {
        await supabase.auth.signOut();
      }

      window.location.href = getLoginUrl(mode);
    });
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={pending}
      aria-label="Çıkış"
      className={cn(
        "flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-slate-300 transition hover:bg-slate-800 hover:text-white",
        pending && "cursor-not-allowed opacity-60",
      )}
    >
      <LogOut className="size-4" />
      <span>{pending ? "..." : "Çıkış"}</span>
    </button>
  );
}
