'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowRight, Quote, Star } from 'lucide-react'
import { SiteNavbar, SiteFooter, PageHero } from '@/components/site-chrome'

const logos = [
  'Lucatech', 'Genax', 'TopShop', 'Anadolu Toptan', 'MegaDistribu', 'Bayikim',
  'NetGross', 'KobiPlus', 'B2BMarket', 'WholePro', 'YurtTopt',
  'AkdenizDS', 'ToptanX',
]

const cases = [
  {
    company: 'Lucatech', sector: 'Elektronik Aksesuar',
    quote: 'Eski sistemde 3 hafta süren vitrin güncellemesi artık birkaç dakika. Müşterilerimiz fiyat değişikliklerini aynı gün görüyor.',
    author: 'Şerafettin Akbaş', role: 'Kurucu Ortak',
    metrics: [['%340', 'Sipariş artışı'], ['1dk', 'Vitrin güncellemesi'], ['2.4x', 'Satış hızı']],
  },
  {
    company: 'Anadolu Toptan Gıda', sector: 'Gıda Distribütörü',
    quote: '4 farklı şubemiz, aynı vitrinden. Bayi fiyatları ve anlaşmalı müşteri fiyatları artık tek bir Excel\'den yönetiliyor.',
    author: 'Ayşe Demir', role: 'Operasyon Müdürü',
    metrics: [['4', 'Şube tek vitrin'], ['%62', 'Operasyon tasarrufu'], ['12K', 'Aktif ürün']],
  },
  {
    company: 'NetGross Toptan', sector: 'Tekstil',
    quote: 'Önce "1 dakikada mı olur?" dedik. Şimdi "5 dakikada olsa zaten yavaş kalırdı" diyoruz. Tasarım hiç bozulmuyor.',
    author: 'Burak Şahin', role: 'Genel Müdür',
    metrics: [['%87', 'Daha az destek talebi'], ['840', 'Bayi girişi'], ['₺0', 'Geliştirme maliyeti']],
  },
]

const testimonials = [
  { t: 'Kurulum gece yarısı yaptım, sabaha vitrin hazırdı. İnanılmaz.', a: 'Emre Y.', c: 'TopShop' },
  { t: 'Excel\'imi yükledim, kategoriler sıfırdan kuruldu. AI büyüsü.', a: 'Selin K.', c: 'B2BMarket' },
  { t: '3:1 banner garantisi altın değerinde. Hiçbir layout artık bozulmuyor.', a: 'Hakan T.', c: 'MegaDistribu' },
  { t: '850 ürünü tek seferde yükledim. Müşterilerimiz şok oldu.', a: 'Zeynep A.', c: 'AkdenizDS' },
  { t: 'B2B sipariş akışı mükemmel. Klasik e-ticareti unuttuk.', a: 'Ali Ö.', c: 'WholePro' },
  { t: '3 seviyeli fiyatlandırma bizim için oyun değiştirici oldu.', a: 'Cem D.', c: 'YurtTopt' },
]

const Page = () => {
  return (
    <main className="relative min-h-screen bg-[#090d16] text-white overflow-hidden">
      <SiteNavbar />
      <PageHero
        tag="Müşterilerimiz"
        title={<>850+ toptancı zaten <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#10b981] to-[#00ff87]">eKatalox’ta.</span></>}
        subtitle="Küçük butiklerden çok lokasyonlu distribütörlere kadar; tüm B2B oyuncuları aynı vitrinde buluşturuyoruz."
      />

      <section className="px-6 pb-24">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-3 md:grid-cols-6 gap-3 md:gap-4">
            {logos.map((l, i) => (
              <motion.div key={l} initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true, amount: 0.3 }} transition={{ delay: i * 0.04, duration: 0.5 }}
                className="aspect-[2/1] rounded-xl border border-white/10 bg-white/[0.02] flex items-center justify-center hover:border-white/20 hover:bg-white/[0.04] transition-colors">
                <span className="text-sm md:text-base text-slate-400 font-semibold tracking-tight">{l}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 pb-24">
        <div className="max-w-7xl mx-auto">
          <motion.h2 initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.3 }} className="text-3xl md:text-5xl font-bold tracking-tight text-center mb-3" style={{ letterSpacing: '-0.04em' }}>Müşteri Deneyimleri</motion.h2>
          <p className="text-center text-slate-400 mb-14">Rakamları gerçek müşterilerimizden duyun.</p>
          <div className="space-y-5">
            {cases.map((c, i) => (
              <motion.div key={c.company} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.2 }} transition={{ duration: 0.7, delay: i * 0.08 }} className="relative rounded-3xl border border-white/10 bg-gradient-to-b from-white/[0.04] to-transparent p-7 md:p-10 overflow-hidden">
                <div className="absolute -top-20 -right-20 w-60 h-60 rounded-full bg-[#10b981]/10 blur-3xl pointer-events-none" />
                <div className="grid md:grid-cols-[1.5fr_1fr] gap-8 relative">
                  <div>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#10b981]/30 to-[#00ff87]/30 border border-white/10 flex items-center justify-center text-sm font-bold text-white">{c.company[0]}</div>
                      <div>
                        <div className="text-white font-semibold">{c.company}</div>
                        <div className="text-xs text-slate-500">{c.sector}</div>
                      </div>
                    </div>
                    <Quote className="w-6 h-6 text-[#10b981] mb-2" />
                    <p className="text-lg md:text-xl text-white font-light leading-snug max-w-lg">{c.quote}</p>
                    <div className="mt-4 text-sm text-slate-400">— <span className="text-white">{c.author}</span>, {c.role}</div>
                  </div>
                  <div className="grid grid-cols-3 md:grid-cols-1 gap-3">
                    {c.metrics.map(([v, l]) => (
                      <div key={l} className="p-4 rounded-xl border border-white/10 bg-white/[0.02] text-center">
                        <div className="text-xl md:text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#10b981] to-[#00ff87]">{v}</div>
                        <div className="text-[11px] text-slate-500 uppercase tracking-widest mt-1">{l}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 pb-24">
        <div className="max-w-6xl mx-auto">
          <motion.h2 initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.3 }} className="text-3xl md:text-5xl font-bold tracking-tight text-center mb-3" style={{ letterSpacing: '-0.04em' }}>Müşterilerimiz neler diyor?</motion.h2>
          <div className="mt-12 grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {testimonials.map((t, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }} whileHover={{ y: -4 }} className="p-6 rounded-2xl border border-white/10 bg-white/[0.02] hover:border-white/20 transition-colors">
                <div className="flex gap-0.5 mb-3">
                  {[1,2,3,4,5].map(s => <Star key={s} className="w-3.5 h-3.5 fill-[#10b981] text-[#10b981]" />)}
                </div>
                <p className="text-sm text-slate-300 leading-relaxed">“{t.t}”</p>
                <div className="mt-4 text-xs text-slate-500"><span className="text-white">{t.a}</span> · {t.c}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 pb-32">
        <div className="max-w-3xl mx-auto text-center">
          <h3 className="text-3xl md:text-4xl font-bold tracking-tight" style={{ letterSpacing: '-0.04em' }}>Sıradaki başarı hikayesi <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#10b981] to-[#00ff87]">sizinki olsun.</span></h3>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/kayit" className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-white text-black text-sm font-medium hover:scale-105 transition-transform">14 Gün Ücretsiz Dene <ArrowRight className="w-4 h-4" /></Link>
            <Link href="/iletisim" className="text-sm text-slate-400 hover:text-white">Demo talep et →</Link>
          </div>
        </div>
      </section>

      <SiteFooter />
    </main>
  )
}

export default Page
