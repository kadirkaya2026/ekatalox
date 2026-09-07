import type { Metadata } from 'next'
import Link from 'next/link'
import { SiteNavbar, SiteFooter } from '@/components/site-chrome'

// Henüz bir bayiye atanmamış QR kodu okutulduğunda buraya düşülür
// (bkz. app/t/[slug]/route.ts).
//
// Magnetler bayi belli olmadan basılıp sahaya çıkabiliyor. Elinde magnet
// olan müşteriye hata sayfası ya da tanıtım sitesi göstermek kafa
// karıştırıcı; burada ne olduğu açıkça yazıyor ve kod görünür kalıyor ki
// bayi telefonda "şu kod bende" diyebilsin.

export const metadata: Metadata = {
  title: 'Mağaza Yakında',
  robots: { index: false, follow: false },
}

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ kod?: string }>
}) {
  const { kod } = await searchParams

  return (
    <main className="relative min-h-screen bg-[#090d16] text-white overflow-hidden">
      <SiteNavbar />

      <div
        className="absolute -top-40 left-1/4 w-[700px] h-[700px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(closest-side, rgba(var(--marketing-primary-rgb), 0.15), transparent)' }}
      />

      <section className="relative px-6 py-28">
        <div className="max-w-lg mx-auto text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-white/5">
            <span className="text-3xl">🏪</span>
          </div>

          <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">
            Bu mağaza yakında burada
          </h1>

          <p className="mt-4 text-slate-400 leading-relaxed">
            Okuttuğunuz kod henüz bir mağazaya bağlanmadı. Mağaza kataloğunu
            yayına aldığında bu kod doğrudan oraya yönlendirecek — magnetinizi
            saklayın, yeniden okutmanız yeterli.
          </p>

          {kod ? (
            <div className="mt-8 inline-flex flex-col items-center gap-1.5 rounded-2xl border border-white/10 bg-white/5 px-6 py-4">
              <span className="text-[11px] uppercase tracking-[0.22em] text-slate-500">
                Kod
              </span>
              <span className="font-mono text-xl tracking-[0.3em] text-white">
                {kod.toUpperCase()}
              </span>
            </div>
          ) : null}

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/"
              className="inline-flex items-center justify-center px-6 py-3 rounded-full bg-white text-black font-medium text-sm hover:scale-[1.01] transition-transform"
            >
              eKatalox nedir?
            </Link>
            <Link
              href="/kayit"
              className="inline-flex items-center justify-center px-6 py-3 rounded-full border border-white/15 text-white font-medium text-sm hover:bg-white/5 transition-colors"
            >
              Mağazam için katalog istiyorum
            </Link>
          </div>
        </div>
      </section>

      <SiteFooter />
    </main>
  )
}
