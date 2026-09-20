"use client";

// Koyu navbar (21 Eyl 2026 yeniden tasarım): tüm pazarlama sitesinde sabit
// koyu üst bar. Sayfa gövdesi açık kalsa da header her zaman koyu — modern
// SaaS sitelerinde yaygın "koyu bar + açık içerik" düzeni.
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { EkataloxLogo } from "@/components/brand/ekatalox-logo";
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
    <header className="sticky top-0 z-40 border-b border-brand-dark-line bg-brand-dark/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-5 sm:px-8">
        <Link href="/" className="flex items-center gap-2" aria-label="eKatalox ana sayfa">
          <EkataloxLogo variant="dark" alt="eKatalox" priority className="h-8 w-[132px]" />
        </Link>

        <nav className="hidden items-center gap-1 lg:flex" aria-label="Ana menü">
          {NAV_LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={cn(
                "rounded-full px-3 py-2 text-sm font-medium text-white/70 hover:bg-white/5 hover:text-white",
                isActive(l.href) && "text-brand-neon",
              )}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2 lg:flex">
          <Link href="/login" className="rounded-full px-3 py-2 text-sm font-medium text-white/70 hover:bg-white/5 hover:text-white">
            Giriş
          </Link>
          <Link
            href="/basvuru"
            className="rounded-full bg-brand-neon px-4 py-2 text-sm font-semibold text-white transition-shadow hover:shadow-[0_0_24px_-4px_rgba(34,197,94,0.6)]"
          >
            {SIGNUP_CTA}
          </Link>
        </div>

        <button
          type="button"
          className="rounded-md p-2 text-white lg:hidden"
          aria-label={open ? "Menüyü kapat" : "Menüyü aç"}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X className="size-6" /> : <Menu className="size-6" />}
        </button>
      </div>

      {open ? (
        <div className="border-t border-brand-dark-line bg-brand-dark lg:hidden">
          <nav className="mx-auto flex max-w-6xl flex-col px-5 py-3" aria-label="Mobil menü">
            {NAV_LINKS.map((l) => (
              <Link key={l.href} href={l.href} className="rounded-md px-3 py-3 text-base font-medium text-white/85">
                {l.label}
              </Link>
            ))}
            <div className="mt-3 flex gap-2 border-t border-brand-dark-line pt-3">
              <Link href="/login" className="flex-1 rounded-full border border-white/20 px-4 py-3 text-center text-sm font-semibold text-white">
                Giriş
              </Link>
              <Link href="/basvuru" className="flex-1 rounded-full bg-brand-neon px-4 py-3 text-center text-sm font-semibold text-white">
                {SIGNUP_CTA}
              </Link>
            </div>
          </nav>
        </div>
      ) : null}
    </header>
  );
}
