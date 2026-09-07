"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { ChevronDown, Menu, X } from "lucide-react";
import { NAV_LINKS } from "@/lib/marketing/site";
import { SECTORS } from "@/lib/marketing/sectors";
import { cn } from "@/lib/utils";

export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [sectorsOpen, setSectorsOpen] = useState(false);

  // Rota değişince mobil menüyü kapat.
  useEffect(() => {
    setOpen(false);
    setSectorsOpen(false);
  }, [pathname]);

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);
  const sectorActive = SECTORS.some((s) => pathname === `/${s.slug}`);

  return (
    <header className="sticky top-0 z-40 border-b border-brand-line bg-white/95 backdrop-blur-sm">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-5 sm:px-8">
        <Link href="/" className="flex items-center gap-2" aria-label="eKatalox ana sayfa">
          <Image src="/ekatalox-logo-rgb-v2.png" alt="eKatalox" width={132} height={34} priority className="h-8 w-auto" />
        </Link>

        <nav className="hidden items-center gap-1 lg:flex" aria-label="Ana menü">
          <Link
            href={NAV_LINKS[0].href}
            className={cn("rounded-md px-3 py-2 text-sm font-medium text-brand-ink hover:bg-brand-navy-soft", isActive(NAV_LINKS[0].href) && "text-brand-green")}
          >
            {NAV_LINKS[0].label}
          </Link>
          <div className="relative" onMouseEnter={() => setSectorsOpen(true)} onMouseLeave={() => setSectorsOpen(false)}>
            <button
              type="button"
              aria-expanded={sectorsOpen}
              onClick={() => setSectorsOpen((v) => !v)}
              className={cn("flex items-center gap-1 rounded-md px-3 py-2 text-sm font-medium text-brand-ink hover:bg-brand-navy-soft", sectorActive && "text-brand-green")}
            >
              Kimler için <ChevronDown className="size-4" />
            </button>
            {sectorsOpen ? (
              <div className="absolute left-0 top-full w-64 rounded-lg border border-brand-line bg-white p-2 shadow-lg">
                {SECTORS.map((s) => (
                  <Link
                    key={s.slug}
                    href={`/${s.slug}`}
                    className={cn("block rounded-md px-3 py-2 text-sm text-brand-ink hover:bg-brand-navy-soft", pathname === `/${s.slug}` && "text-brand-green")}
                  >
                    {s.label}
                  </Link>
                ))}
              </div>
            ) : null}
          </div>
          {NAV_LINKS.slice(1).map((l) => (
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
            Ücretsiz başvur
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
            <Link href={NAV_LINKS[0].href} className="rounded-md px-3 py-3 text-base font-medium">
              {NAV_LINKS[0].label}
            </Link>
            <p className="px-3 pb-1 pt-3 text-xs font-semibold uppercase tracking-[0.12em] text-brand-muted">Kimler için</p>
            <div className="grid grid-cols-2 gap-1">
              {SECTORS.map((s) => (
                <Link key={s.slug} href={`/${s.slug}`} className="rounded-md px-3 py-2 text-sm">
                  {s.label}
                </Link>
              ))}
            </div>
            {NAV_LINKS.slice(1).map((l) => (
              <Link key={l.href} href={l.href} className="rounded-md px-3 py-3 text-base font-medium">
                {l.label}
              </Link>
            ))}
            <div className="mt-3 flex gap-2 border-t border-brand-line pt-3">
              <Link href="/login" className="flex-1 rounded-md border border-brand-line px-4 py-3 text-center text-sm font-semibold">
                Giriş
              </Link>
              <Link href="/basvuru" className="flex-1 rounded-md bg-brand-green px-4 py-3 text-center text-sm font-semibold text-white">
                Ücretsiz başvur
              </Link>
            </div>
          </nav>
        </div>
      ) : null}
    </header>
  );
}
