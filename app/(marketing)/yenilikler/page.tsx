'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { Sparkles, Zap, Bug, Plus, ArrowRight } from 'lucide-react'
import { SiteNavbar, SiteFooter, PageHero } from '@/components/site-chrome'

const releases = [
  {
    version: 'v3.4', date: '12 Haziran 2025', badge: 'major',
    title: 'AI Akıllı Eşleştirme 2.0',
    summary: 'Excel sütun başlıklarını otomatik tanıma sistemini tamamen yeniledik. Artık Türkçe, İngilizce ve karışık dosyaları aynı doğrulukla işliyor.',
    items: [
      ['feature', 'Kolon başlıkları için %94 doğruluk oranı (önceki: %78)'],
      ['feature', '3 derinliğe kadar otomatik kategori ağacı oluşturma'],
      ['feature', 'Çoklu para birimi tek dosyadan otomatik standardizasyon'],
      ['improvement', 'İşlem süresi %40 hızlandı, ortalama 2.9 saniye'],
    ],
  },
  {
    version: 'v3.3', date: '28 Mayıs 2025', badge: 'feature',
    title: 'Drag & Drop Sıralama Paneli',
    summary: 'Yönetim panelinde ürünleri sürükle-bırak ile sıralayabilirsiniz. Vitrindeki görünüm sırası anında güncellenir.',
    items: [
      ['feature', 'Sürükle-bırak ile gerçek zamanlı sıralama'],
      ['feature', 'Toplu seçim ile yığın taşıma (Shift + Click)'],
      ['improvement', 'Vitrin önbelleği akıllı invalidation'],
    ],
  },
  {
    version: 'v3.2', date: '10 Mayıs 2025', badge: 'feature',
    title: '3:1 Akıllı Banner Kilidi',
    summary: 'Banner yüklemelerinde tasarım disiplini garantisi. Hiçbir layout bir daha kırılmayacak.',
    items: [
      ['feature', '1200x400 oranına otomatik akıllı crop'],
      ['feature', 'Edge case algılama (yüz, logo, metin alanı korunur)'],
      ['feature', 'CDN üzerinde WebP/AVIF optimize'],
    ],
  },
  {
    version: 'v3.1', date: '22 Nisan 2025', badge: 'improvement',
    title: 'B2B Sipariş Akışı İyileştirmeleri',
    summary: 'MOQ (minimum sipariş), KDV ve bayi onay süreçleri tek panelde toplandı.',
    items: [
      ['feature', 'MOQ kuralları ürün/kategori/müşteri bazlı'],
      ['feature', 'Otomatik KDV hesaplaması (8%, 18%, 20%)'],
      ['improvement', 'Sipariş özet PDF\'i yeniden tasarlandı'],
      ['fix', 'Bayi panelinde stok yenileme gecikmesi giderildi'],
    ],
  },
  {
    version: 'v3.0', date: '5 Nisan 2025', badge: 'major',
    title: 'eKatalox 3.0 — Yeni Nesil Vitrin',
    summary: 'Apple tarzı tamamen yeniden tasarlanmış vitrin teması, 4x daha hızlı render ve mobil first deneyim.',
    items: [
      ['feature', 'Yeni vitrin teması (Studio Dark + Studio Light)'],
      ['feature', 'Mobil sipariş akışı, tek el ile kullanım'],
      ['feature', 'Lazy image loading ve edge caching'],
      ['improvement', 'Sayfa açılış süresi 1.2sn → 0.3sn'],
    ],
  },
  {
    version: 'v2.8', date: '18 Mart 2025', badge: 'fix',
    title: 'Stabilite & Performans',
    summary: '12 farklı hata düzeltildi, yapay zeka eşleştirme performansı %22 artırıldı.',
    items: [
      ['fix', 'Türkçe karakter içeren Excel kolonlarındaki hata'],
      ['fix', 'Banner yüklemede nadir görülen 504 hatası'],
      ['improvement', 'Sunucu yanıt süresi %22 azaltıldı'],
    ],
  },
]

const badgeStyles = {
  major: 'bg-gradient-to-r from-[var(--marketing-primary)] to-[var(--marketing-accent)] text-white',
  feature: 'bg-[var(--marketing-primary)]/15 text-[var(--marketing-primary)] border border-[var(--marketing-primary)]/30',
  improvement: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30',
  fix: 'bg-amber-500/15 text-amber-400 border border-amber-500/30',
}
const badgeLabel = { major: 'Major Sürüm', feature: 'Yeni Özellik', improvement: 'İyileştirme', fix: 'Hata Düzeltme' }
const itemIcon = {
  feature: { icon: Plus, color: 'text-[var(--marketing-primary)]' },
  improvement: { icon: Zap, color: 'text-emerald-400' },
  fix: { icon: Bug, color: 'text-amber-400' },
}

const Page = () => {
  return (
    <main className="relative min-h-screen bg-[#090d16] text-white overflow-hidden">
      <SiteNavbar />
      <PageHero
        tag="Yenilikler"
        title={<>Sürekli daha <span className="bg-clip-text text-transparent bg-gradient-to-r from-[var(--marketing-primary)] to-[var(--marketing-accent)]">hızlı, daha iyi.</span></>}
        subtitle="Her ay yeni özellikler, iyileştirmeler ve düzeltmeler. Geri bildiriminizle şekilleniyoruz."
      />

      <section className="relative px-6 pb-32">
        <div className="max-w-4xl mx-auto">
          <div className="relative">
            <div className="absolute left-4 md:left-6 top-2 bottom-2 w-px bg-gradient-to-b from-[var(--marketing-primary)]/40 via-[var(--marketing-accent)]/40 to-transparent" />
            <div className="space-y-8 md:space-y-10">
              {releases.map((r, i) => (
                <motion.article key={r.version} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.15 }} transition={{ duration: 0.7, delay: i * 0.05, ease: [0.16, 1, 0.3, 1] }} className="relative pl-12 md:pl-16">
                  <div className="absolute left-1.5 md:left-3.5 top-7 w-6 h-6 rounded-full bg-[#090d16] border border-white/10 flex items-center justify-center">
                    <div className="w-2.5 h-2.5 rounded-full bg-gradient-to-br from-[var(--marketing-primary)] to-[var(--marketing-accent)]" />
                  </div>
                  <div className="rounded-3xl border border-white/10 bg-gradient-to-b from-white/[0.04] to-transparent p-6 md:p-8 hover:border-white/20 transition-colors">
                    <div className="flex flex-wrap items-center gap-3 mb-4">
                      <span className="text-[var(--marketing-primary)] font-mono text-sm tracking-wider">{r.version}</span>
                      <span className="text-xs text-slate-500">{r.date}</span>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium uppercase tracking-wider ${badgeStyles[r.badge]}`}>
                        {r.badge === 'major' && <Sparkles className="w-2.5 h-2.5" />}
                        {badgeLabel[r.badge]}
                      </span>
                    </div>
                    <h2 className="text-xl md:text-2xl font-semibold text-white">{r.title}</h2>
                    <p className="mt-2 text-sm md:text-base text-slate-400 leading-relaxed">{r.summary}</p>
                    <ul className="mt-5 space-y-2">
                      {r.items.map(([type, text], j) => {
                        const Ic = itemIcon[type].icon
                        return (
                          <li key={j} className="flex items-start gap-2.5 text-sm text-slate-300">
                            <Ic className={`w-3.5 h-3.5 mt-1 flex-shrink-0 ${itemIcon[type].color}`} />
                            <span>{text}</span>
                          </li>
                        )
                      })}
                    </ul>
                  </div>
                </motion.article>
              ))}
            </div>
          </div>

          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.3 }} className="mt-20 rounded-3xl border border-white/10 bg-gradient-to-b from-white/[0.04] to-transparent p-8 md:p-10 text-center">
            <Sparkles className="w-7 h-7 text-[var(--marketing-primary)] mx-auto" />
            <h3 className="mt-4 text-2xl md:text-3xl font-bold tracking-tight" style={{ letterSpacing: '-0.04em' }}>Bir yenilik kaçırmayın.</h3>
            <p className="mt-3 text-slate-400 max-w-md mx-auto">Yeni sürüm notlarını ayda bir kez doğrudan gelen kutunuza alın.</p>
            <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link href="/iletisim" className="px-6 py-3 rounded-full bg-white text-black text-sm font-medium hover:scale-105 transition-transform inline-flex items-center gap-2">
                Bize Ulaşın <ArrowRight className="w-4 h-4" />
              </Link>
              <Link href="/yardim" className="text-sm text-slate-400 hover:text-white">Tüm geçmişi görün →</Link>
            </div>
          </motion.div>
        </div>
      </section>

      <SiteFooter />
    </main>
  )
}

export default Page
