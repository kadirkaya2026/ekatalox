'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowRight, ExternalLink, Monitor, Smartphone } from 'lucide-react'
import { SiteNavbar, SiteFooter, PageHero } from '@/components/site-chrome'
import { STOREFRONT_THEME_PRESETS } from '@/lib/storefront/theme-presets'

const SECTORS = ['Tümü', ...STOREFRONT_THEME_PRESETS.map((preset) => preset.sector)]

const Page = () => {
  const [activeSector, setActiveSector] = useState('Tümü')

  const filteredPresets = useMemo(() => {
    if (activeSector === 'Tümü') return STOREFRONT_THEME_PRESETS
    return STOREFRONT_THEME_PRESETS.filter((preset) => preset.sector === activeSector)
  }, [activeSector])

  return (
    <main className="relative min-h-screen bg-[#090d16] text-white overflow-hidden">
      <SiteNavbar />
      <PageHero
        tag="Temalar"
        title={
          <>
            Sektörünüze hazır,{' '}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-[var(--marketing-primary)] to-[var(--marketing-accent)]">
              canlı çalışan
            </span>{' '}
            vitrinler.
          </>
        }
        subtitle="Her tema sadece bir renk paleti değil; header, banner, vitrin düzeni ve ürün kartları sektörünüze göre baştan tasarlandı. Karta tıklayın, gerçek bir eKatalox mağazasını canlı gezin."
      />

      <section className="px-6 pb-10">
        <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-center gap-2.5">
          {SECTORS.map((sector) => (
            <button
              key={sector}
              onClick={() => setActiveSector(sector)}
              className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors ${
                activeSector === sector
                  ? 'bg-white text-black border-white'
                  : 'bg-white/[0.02] text-slate-300 border-white/10 hover:border-white/25 hover:text-white'
              }`}
            >
              {sector}
            </button>
          ))}
        </div>
      </section>

      <section className="px-6 pb-28">
        <div className="max-w-6xl mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeSector}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.35 }}
              className="grid md:grid-cols-2 xl:grid-cols-3 gap-6"
            >
              {filteredPresets.map((preset, i) => (
                <motion.a
                  key={preset.key}
                  href={`https://${preset.demoSubdomain}.ekatalox.com`}
                  target="_blank"
                  rel="noopener noreferrer"
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{ duration: 0.6, delay: (i % 3) * 0.08 }}
                  whileHover={{ y: -6 }}
                  className="group relative flex flex-col overflow-hidden rounded-3xl border border-white/10 bg-white/[0.02] hover:border-white/25 transition-colors"
                >
                  <div className="relative aspect-[4/3] w-full overflow-hidden bg-slate-900">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={preset.thumbnailDesktop}
                      alt={`${preset.title} tema önizlemesi`}
                      className="h-full w-full object-cover object-top transition-transform duration-500 group-hover:scale-105"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/0 to-black/0" />
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40">
                      <span className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-black">
                        Canlı Demoyu Gez
                        <ExternalLink className="w-4 h-4" />
                      </span>
                    </div>
                    <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-black/60 backdrop-blur px-3 py-1 text-[11px] font-medium text-white border border-white/10">
                      {preset.sector}
                    </span>
                    <span className="absolute right-3 top-3 flex items-center gap-1.5 text-white/70">
                      <Monitor className="w-3.5 h-3.5" />
                      <Smartphone className="w-3.5 h-3.5" />
                    </span>
                  </div>

                  <div className="p-5">
                    <h3 className="text-lg font-semibold text-white">{preset.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-slate-400">
                      {preset.description}
                    </p>
                    <div className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-[var(--marketing-primary)]">
                      Canlı demoyu incele
                      <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                    </div>
                  </div>
                </motion.a>
              ))}
            </motion.div>
          </AnimatePresence>
        </div>
      </section>

      <section className="px-6 pb-32">
        <div className="max-w-3xl mx-auto text-center">
          <h3 className="text-3xl md:text-4xl font-bold tracking-tight" style={{ letterSpacing: '-0.04em' }}>
            Aradığınız tema burada yoksa,{' '}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-[var(--marketing-primary)] to-[var(--marketing-accent)]">
              birlikte tasarlayalım.
            </span>
          </h3>
          <p className="mt-4 text-slate-400">
            Her temanın rengini, düzenini ve içeriğini kayıt olduktan sonra kendi panelinizden
            de özelleştirebilirsiniz.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/kayit"
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-white text-black text-sm font-medium hover:scale-105 transition-transform"
            >
              14 Gün Ücretsiz Dene <ArrowRight className="w-4 h-4" />
            </Link>
            <Link href="/iletisim" className="text-sm text-slate-400 hover:text-white">
              Demo talep et →
            </Link>
          </div>
        </div>
      </section>

      <SiteFooter />
    </main>
  )
}

export default Page
