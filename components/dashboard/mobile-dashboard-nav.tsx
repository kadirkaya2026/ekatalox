"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { EkataloxLogo } from "@/components/brand/ekatalox-logo";
import { Sidebar } from "@/components/dashboard/sidebar";
import { useBodyScrollLock } from "@/lib/hooks/use-body-scroll-lock";
import type { TenantPlan } from "@/lib/billing/plans";
import type { TenantBusinessType } from "@/lib/types";

export function MobileDashboardNav({
  mode,
  title,
  subtitle,
  plan,
  businessType,
}: {
  mode: "admin" | "tenant";
  title: string;
  subtitle: string;
  plan?: TenantPlan;
  businessType?: TenantBusinessType;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [openedForPathname, setOpenedForPathname] = useState(pathname);

  if (pathname !== openedForPathname) {
    setOpenedForPathname(pathname);
    if (open) {
      setOpen(false);
    }
  }

  useBodyScrollLock(open);

  return (
    <div className="border-b border-slate-800 bg-slate-900 md:hidden">
      <div className="flex items-center justify-between px-4 py-3">
        <Link href="/#top" className="inline-flex">
          <EkataloxLogo className="h-7 w-[130px]" />
        </Link>
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Menüyü aç"
          className="rounded-lg p-2 text-slate-200 transition hover:bg-slate-800"
        >
          <Menu className="size-5" />
        </button>
      </div>

      {open ? (
        <div className="fixed inset-0 z-[70] flex">
          <button
            type="button"
            aria-label="Menüyü kapat"
            className="absolute inset-0 bg-black/50"
            onClick={() => setOpen(false)}
          />
          <div className="relative z-10 h-full w-[85vw] max-w-xs">
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Menüyü kapat"
              className="absolute right-3 top-3 z-20 rounded-full bg-slate-800 p-2 text-slate-200 transition hover:bg-slate-700"
            >
              <X className="size-4" />
            </button>
            <Sidebar
              mode={mode}
              title={title}
              subtitle={subtitle}
              plan={plan}
              businessType={businessType}
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}
