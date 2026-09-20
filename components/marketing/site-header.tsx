"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { NAV_LINKS, SIGNUP_CTA } from "@/lib/marketing/site";
import { cn } from "@/lib/utils";

export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // Rota değişince mobil menüyü kapat (render sırasında, effect değil).
  const [prevPathname, setPrevPathname] = useState(pathname);
  if (pathname !== prevPathname) {
    setPrevPathname(pathname);
    setOpen(false);
  }

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <header className="sticky top-0 z-40 border-b border-brand-line bg-white/95 backdrop-blur-sm">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-5 sm:px-8">
        <Link href="/" className="flex items-center gap-2" aria-label="eKatalox ana sayfa">
          <Image src="/ekatalox-logo-kurumsal.png" alt="eKatalox" width={132} height={34} loading="eager" fetchPriority="high" className="h-8 w-auto" />
        </Link>

        <nav className="hidden items-center gap-1 lg:flex" aria-label="Ana menü">
          {NAV_LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={cn("rounded-md px-3 py-2 text-sm font-medium text-brand-ink hover:bg-brand-navy-soft", isActive(l.href) && "text-brand-green")}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2 lg:flex">
          <Link href="/login" className="rounded-md px-3 py-2 text-sm font-medium text-brand-ink hover:bg-brand-navy-soft">
            Giriş
          </Link>
          <Link href="/basvuru" className="rounded-md bg-brand-green px-4 py-2 text-sm font-semibold text-white hover:bg-[#126A4F]">
            {SIGNUP_CTA}
          </Link>
        </div>

        <button
          type="button"
          className="rounded-md p-2 text-brand-ink lg:hidden"
          aria-label={open ? "Menüyü kapat" : "Menüyü aç"}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X className="size-6" /> : <Menu className="size-6" />}
        </button>
      </div>

      {open ? (
        <div className="border-t border-brand-line bg-white lg:hidden">
          <nav className="mx-auto flex max-w-6xl flex-col px-5 py-3" aria-label="Mobil menü">
            {NAV_LINKS.map((l) => (
              <Link key={l.href} href={l.href} className="rounded-md px-3 py-3 text-base font-medium">
                {l.label}
              </Link>
            ))}
            <div className="mt-3 flex gap-2 border-t border-brand-line pt-3">
              <Link href="/login" className="flex-1 rounded-md border border-brand-line px-4 py-3 text-center text-sm font-semibold">
                Giriş
              </Link>
              <Link href="/basvuru" className="flex-1 rounded-md bg-brand-green px-4 py-3 text-center text-sm font-semibold text-white">
                {SIGNUP_CTA}
              </Link>
            </div>
          </nav>
        </div>
      ) : null}
    </header>
  );
}
