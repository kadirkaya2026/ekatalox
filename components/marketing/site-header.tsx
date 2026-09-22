"use client";

// Pazarlama sitesi (ekatalox.com) üst barı — "Apple tarzı yüzen ada"
// (kullanıcı isteği, 22 Eyl 2026; Instagram referansı: code.xr "Apple Type
// Navbar"). Sayfa tepedeyken tam genişlik koyu bar; ~24px kaydırınca
// kenarlardan içeri çekilip yuvarlak, camsı (backdrop-blur) bir hapa dönüşür.
//
// Yerleşim kuralı: <header> HER ZAMAN sabit 4rem yüksekliktedir ve hap onun
// içinde ABSOLUTE durur — böylece daralma/genişleme sırasında sayfa içeriği
// zıplamaz (sticky öğenin yüksekliği değişseydi altındaki her şey kayardı).
//
// Kapsam: yalnız (marketing) layout'u. Bayi paneli ve tenant vitrinleri bu
// bileşeni KULLANMAZ, onların kendi başlıkları var.
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Menu, X } from "lucide-react";
import { EkataloxLogo } from "@/components/brand/ekatalox-logo";
import { NAV_LINKS, SIGNUP_CTA } from "@/lib/marketing/site";
import { cn } from "@/lib/utils";

export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [hovered, setHovered] = useState<string | null>(null);

  // Rota değişince mobil menüyü kapat (render sırasında, effect değil).
  const [prevPathname, setPrevPathname] = useState(pathname);
  if (pathname !== prevPathname) {
    setPrevPathname(pathname);
    setOpen(false);
  }

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <header className="sticky top-0 z-40 h-16">
      <div
        className={cn(
          "absolute transition-all duration-300 ease-out motion-reduce:transition-none",
          scrolled
            ? // Yüzen ada: kenarlardan içeri, yuvarlak, camsı, gölgeli.
              "inset-x-3 top-2 h-[3.25rem] rounded-full border border-white/12 bg-brand-dark/70 shadow-[0_10px_34px_-12px_rgba(0,0,0,0.75)] backdrop-blur-xl sm:inset-x-6 lg:inset-x-0 lg:mx-auto lg:max-w-5xl"
            : "inset-x-0 top-0 h-16 rounded-none border-b border-brand-dark-line bg-brand-dark/90 backdrop-blur-md",
        )}
      >
        <div
          className={cn(
            "mx-auto flex h-full w-full items-center justify-between transition-all duration-300 ease-out",
            scrolled ? "max-w-5xl px-4 sm:px-5" : "max-w-6xl px-5 sm:px-8",
          )}
        >
          <Link href="/" className="flex items-center gap-2" aria-label="eKatalox ana sayfa">
            <EkataloxLogo
              variant="dark"
              alt="eKatalox"
              priority
              className={cn("transition-all duration-300", scrolled ? "h-7 w-[116px]" : "h-8 w-[132px]")}
            />
          </Link>

          <nav className="hidden items-center gap-1 lg:flex" aria-label="Ana menü">
            {NAV_LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onMouseEnter={() => setHovered(l.href)}
                onMouseLeave={() => setHovered(null)}
                onFocus={() => setHovered(l.href)}
                onBlur={() => setHovered(null)}
                className={cn(
                  "relative rounded-full px-3 py-2 text-sm font-medium text-white/70 transition-colors hover:text-white",
                  isActive(l.href) && "text-brand-neon",
                )}
              >
                {/* Kayan vurgu: aynı layoutId sayesinde linkten linke kayar. */}
                {hovered === l.href ? (
                  <motion.span
                    layoutId="marketing-nav-pill"
                    className="absolute inset-0 rounded-full bg-white/10"
                    transition={{ type: "spring", stiffness: 420, damping: 34 }}
                  />
                ) : null}
                <span className="relative">{l.label}</span>
              </Link>
            ))}
          </nav>

          <div className="hidden items-center gap-2 lg:flex">
            <Link
              href="/login"
              className="rounded-full px-3 py-2 text-sm font-medium text-white/70 transition-colors hover:bg-white/5 hover:text-white"
            >
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
      </div>

      {/* Mobil menü: hapın altında ayrı camsı panel (hap yuvarlak olduğu için
          içine yerleştirilemez). */}
      {open ? (
        <div
          className={cn(
            "absolute inset-x-3 rounded-2xl border border-white/12 bg-brand-dark/95 shadow-[0_18px_44px_-16px_rgba(0,0,0,0.8)] backdrop-blur-xl transition-all duration-300 sm:inset-x-6 lg:hidden",
            scrolled ? "top-[4rem]" : "top-[4.25rem]",
          )}
        >
          <nav className="flex flex-col p-3" aria-label="Mobil menü">
            {NAV_LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={cn(
                  "rounded-xl px-3 py-3 text-base font-medium text-white/85 hover:bg-white/5",
                  isActive(l.href) && "text-brand-neon",
                )}
              >
                {l.label}
              </Link>
            ))}
            <div className="mt-3 flex gap-2 border-t border-brand-dark-line pt-3">
              <Link
                href="/login"
                className="flex-1 rounded-full border border-white/20 px-4 py-3 text-center text-sm font-semibold text-white"
              >
                Giriş
              </Link>
              <Link
                href="/basvuru"
                className="flex-1 rounded-full bg-brand-neon px-4 py-3 text-center text-sm font-semibold text-white"
              >
                {SIGNUP_CTA}
              </Link>
            </div>
          </nav>
        </div>
      ) : null}
    </header>
  );
}
