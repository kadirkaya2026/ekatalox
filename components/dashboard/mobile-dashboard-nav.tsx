"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
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
  suggestionNoticeCount = 0,
}: {
  mode: "admin" | "tenant";
  title: string;
  subtitle: string;
  plan?: TenantPlan;
  businessType?: TenantBusinessType;
  suggestionNoticeCount?: number;
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
          aria-label={
            suggestionNoticeCount
              ? `Menüyü aç (${suggestionNoticeCount} bildirim)`
              : "Menüyü aç"
          }
          className="relative rounded-lg p-2 text-slate-200 transition hover:bg-slate-800"
        >
          <Menu className="size-5" />
          {suggestionNoticeCount ? (
            <span className="absolute -right-0.5 -top-0.5 inline-flex min-w-[1.125rem] items-center justify-center rounded-full bg-rose-600 px-1 text-[10px] font-bold leading-[1.125rem] text-white ring-2 ring-slate-900">
              {suggestionNoticeCount > 9 ? "9+" : suggestionNoticeCount}
            </span>
          ) : null}
        </button>
      </div>

      <AnimatePresence>
        {open ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="fixed inset-0 z-[70] flex"
          >
            <button
              type="button"
              aria-label="Menüyü kapat"
              className="absolute inset-0 bg-black/50"
              onClick={() => setOpen(false)}
            />
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              className="relative z-10 h-full w-[85vw] max-w-xs"
            >
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
                suggestionNoticeCount={suggestionNoticeCount}
              />
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
