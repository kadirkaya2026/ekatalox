import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowRight, MessageCircle } from "lucide-react";
import type { RetailInfoSection } from "@/lib/storefront/retail-config";
import { cn } from "@/lib/utils";

// Bilgi sayfası (0155): solda/üstte görsel, başlık ve metin; yanda diğer
// sayfalar; altta "Ürünleri incele / Menünüzü oluşturun / WhatsApp" düğmeleri.
export function InfoPageView({
  tenantName,
  logoUrl,
  brandColor,
  page,
  pages,
  menuTitle,
  whatsappHref,
}: {
  tenantName: string;
  logoUrl: string | null;
  brandColor: string;
  page: RetailInfoSection;
  pages: { slug: string; title: string; emoji: string }[];
  menuTitle: string | null;
  whatsappHref: string | null;
}) {
  const paragraphs = page.body.split("\n").map((line) => line.trim()).filter(Boolean);
  const index = pages.findIndex((p) => p.slug === page.slug);
  const next = pages[(index + 1) % pages.length];
  return (
    <div className="min-h-svh bg-[#fbf6f2] text-stone-900">
      <header className="sticky top-0 z-20 border-b border-stone-200/70 bg-[#fbf6f2]/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3">
          <Link href="/" className="flex items-center gap-3">
            {logoUrl ? (
              <Image src={logoUrl} alt="" width={44} height={44} className="size-11 rounded-full object-cover" unoptimized />
            ) : null}
            <span className="font-serif text-lg font-bold">{tenantName}</span>
          </Link>
          <Link href="/" className="ml-auto flex items-center gap-1.5 rounded-full border border-stone-300 px-4 py-2 text-sm font-medium text-stone-700 hover:bg-white">
            <ArrowLeft className="size-4" /> Ürünler
          </Link>
        </div>
      </header>

      <main className="mx-auto grid max-w-6xl gap-8 px-4 py-8 lg:grid-cols-[minmax(0,1fr)_260px] lg:py-12">
        <article className="overflow-hidden rounded-[2rem] bg-white shadow-sm">
          <div className={cn("grid", page.imageUrl ? "md:grid-cols-2" : "")}>
            {page.imageUrl ? (
              <div className="relative aspect-[4/5] md:aspect-auto md:min-h-[520px]">
                <Image src={page.imageUrl} alt={page.title} fill className="object-cover" sizes="(min-width: 768px) 40vw, 100vw" unoptimized />
              </div>
            ) : null}
            <div className="flex flex-col justify-center p-6 sm:p-10">
              <p className="text-sm font-semibold uppercase tracking-[0.2em]" style={{ color: brandColor }}>
                {page.emoji ? `${page.emoji} ` : ""}
                {tenantName}
              </p>
              <h1 className="mt-3 font-serif text-3xl font-bold leading-tight sm:text-4xl">{page.title}</h1>
              <div className="mt-5 space-y-3 text-[17px] leading-8 text-stone-700">
                {paragraphs.map((line) => (
                  <p key={line}>{line}</p>
                ))}
              </div>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link href="/" className="inline-flex h-12 items-center gap-2 rounded-2xl px-6 font-semibold text-white" style={{ backgroundColor: brandColor }}>
                  Ürünleri incele <ArrowRight className="size-4" />
                </Link>
                {menuTitle ? (
                  <Link href="/menu" className="inline-flex h-12 items-center rounded-2xl border border-stone-300 px-6 font-semibold text-stone-800 hover:bg-stone-50">
                    Menünüzü oluşturun
                  </Link>
                ) : null}
                {whatsappHref ? (
                  <a href={whatsappHref} target="_blank" rel="noreferrer" className="inline-flex h-12 items-center gap-2 rounded-2xl border border-emerald-600 px-6 font-semibold text-emerald-700 hover:bg-emerald-50">
                    <MessageCircle className="size-5" /> WhatsApp
                  </a>
                ) : null}
              </div>
            </div>
          </div>
        </article>

        <aside className="space-y-4">
          <nav className="rounded-[1.5rem] bg-white p-3 shadow-sm">
            {pages.map((p) => (
              <Link
                key={p.slug}
                href={`/bilgi/${p.slug}`}
                className={cn(
                  "flex items-center gap-2 rounded-xl px-3 py-2.5 text-[15px] font-medium",
                  p.slug === page.slug ? "text-white" : "text-stone-700 hover:bg-stone-50",
                )}
                style={p.slug === page.slug ? { backgroundColor: brandColor } : undefined}
              >
                <span>{p.emoji}</span>
                {p.title}
              </Link>
            ))}
            {menuTitle ? (
              <Link href="/menu" className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-[15px] font-medium text-stone-700 hover:bg-stone-50">
                <span>🍽️</span>
                {menuTitle}
              </Link>
            ) : null}
          </nav>
          {next && next.slug !== page.slug ? (
            <Link href={`/bilgi/${next.slug}`} className="flex items-center justify-between rounded-[1.5rem] bg-white p-4 text-sm font-semibold text-stone-700 shadow-sm hover:bg-stone-50">
              Sonraki: {next.title} <ArrowRight className="size-4" />
            </Link>
          ) : null}
        </aside>
      </main>
    </div>
  );
}
