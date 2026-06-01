'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, ChevronDown, BookOpen, Zap, CreditCard, Settings, Users, Code, FileText, ArrowRight } from 'lucide-react'
import { SiteNavbar, SiteFooter, PageHero } from '@/components/site-chrome'

const categories = [
  { icon: Zap, title: 'Başlarken', desc: 'İlk vitrininizi 5 saniyede yayına alın', count: 12 },
  { icon: FileText, title: 'Excel Yükleme', desc: 'Format, kolonlar ve ipuçları', count: 18 },
  { icon: Settings, title: 'Vitrin Yönetimi', desc: 'Banner, kategori, sıralama', count: 24 },
  { icon: CreditCard, title: 'Fiyatlandırma & Ödeme', desc: 'Faturalama ve plan değişimi', count: 9 },
  { icon: Users, title: 'B2B Özellikler', desc: 'Bayi, MOQ, anlaşmalı fiyatlar', count: 15 },
  { icon: Code, title: 'API & Geliştiriciler', desc: 'Webhook, REST API, SDK', count: 22 },
]

const faqs = [
  { q: 'Excel dosyamın formatı ne olmalı?', a: 'eKatalox; .xlsx, .xls ve .csv dosyalarını destekler. İlk satır kolon başlıklarını içermelidir. Standart kolonlarımız: Ürün Adı, Kategori, Stok, 1. Fiyat, 2. Fiyat, 3. Fiyat, Para Birimi, Görsel URL. Eksik kolonlar yapay zeka tarafından otomatik tamamlanır.' },
  { q: 'Yapay zeka kategorileri nasıl oluşturuyor?', a: 'Ürün isimlerinizden ve mevcut kategori bilgilerinizden yola çıkarak çok seviyeli (3 derinliğe kadar) bir kategori ağacı oluştururuz. Örneğin "USB-C Kablo 2m" otomatik olarak Elektronik > Aksesuar > Kablo yoluna yerleştirilir.' },
  { q: '3 seviyeli fiyatlandırma nasıl çalışır?', a: 'Profesyonel ve Kurumsal planlarda bir ürünün 3 farklı fiyatı olabilir: 1) Bayi 2) Toptancı 3) Anlaşmalı. Müşterileriniz giriş yaptıklarında kendi seviyelerine uygun fiyatı görür.' },
  { q: 'Banner neden 3:1 oranda kilitleniyor?', a: '1200x400 (3:1) oranı, vitrin tasarımının hiçbir cihazda bozulmaması için mimari bir tercihtir. Yüklediğiniz herhangi bir görsel otomatik crop ve akıllı hizalama ile bu orana getirilir. Layout asla kırılmaz.' },
  { q: 'Özel alan adı (kendi.com) kullanabilir miyim?', a: 'Evet. Profesyonel ve Kurumsal planda kendi alan adınızı bağlayabilirsiniz. DNS ayarlarını destek ekibimiz beraber halleder. Özel alan adı aktifken firmaniz.ekatalox.com adresi otomatik olarak kendi alan adınıza yönlendirilir. Başlangıç planında firmaniz.ekatalox.com formatında subdomain verilir.' },
  { q: 'KVKK ve veri güvenliği nasıl?', a: 'Tüm verileriniz AB sınırları içindeki sunucularda şifreli olarak saklanır. ISO 27001 sertifikamız mevcuttur. KVKK uyumlu şekilde kullanıcı verileri işlenir.' },
  { q: 'Planımı istediğim zaman iptal edebilir miyim?', a: 'Evet. Workspace ayarlarından tek tıkla iptal edebilirsiniz. Yıllık ödeme yaptıysanız kalan dönem için iade alırsınız. Vitrinleriniz 30 gün boyunca arka planda saklanır.' },
  { q: 'Müşterilerim sipariş vermek için nasıl giriş yapar?', a: 'Müşterilerinizi panelden e-postalarıyla davet edersiniz. Onlar da kendi paneline e-posta + şifre ile girer. Her müşteriye özel fiyat seviyesi atayabilirsiniz (Bayi/Toptan/Anlaşmalı).' },
  { q: 'API ile entegrasyon mümkün mü?', a: 'Profesyonel ve Kurumsal planlarda REST API ve webhook desteği vardır. ERP\'iniz, muhasebe yazılımınız veya özel sistemlerinizle gerçek zamanlı senkronizasyon kurabilirsiniz.' },
  { q: 'Destek hızınız nasıl?', a: 'Profesyonel planda ortalama yanıt süremiz 2 saat. Kurumsal planda adanmış müşteri başarı yöneticiniz olur, 7/24 öncelikli destek + SLA garantisi sağlanır.' },
]

const Page = () => {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(0)

  const filtered = faqs.filter(f =>
    f.q.toLowerCase().includes(query.toLowerCase()) ||
    f.a.toLowerCase().includes(query.toLowerCase())
  )

  return (
    <main className="relative min-h-screen bg-[#0B0F19] text-white overflow-hidden">
      <SiteNavbar />
      <PageHero
        tag="Yardım Merkezi"
        title={<>Sorunuza saniyeler içinde <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#00D2FF] to-[#7928CA]">cevap.</span></>}
        subtitle="100+ makale, video rehber ve canlı destek. Ne aradığınızı yazın, biz bulalım."
      >
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.7 }} className="mt-10 max-w-2xl mx-auto">
          <div className="flex items-center gap-3 p-2 rounded-full border border-white/10 bg-black/30 backdrop-blur-xl focus-within:border-[#00D2FF]/60 transition-colors">
            <Search className="w-4 h-4 text-slate-500 ml-3" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Excel yükleme, banner, fiyatlandırma…" className="flex-1 bg-transparent px-2 py-2 text-sm text-white placeholder:text-slate-500 outline-none" />
            <button className="px-4 py-2 rounded-full bg-white text-black text-xs font-medium">Ara</button>
          </div>
        </motion.div>
      </PageHero>

      <section className="px-6 pb-16">
        <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
          {categories.map((c, i) => (
            <motion.div key={c.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: false }} transition={{ delay: i * 0.05 }} whileHover={{ y: -3 }} className="p-5 md:p-6 rounded-2xl border border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04] transition-all cursor-pointer">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#00D2FF]/15 to-[#7928CA]/15 flex items-center justify-center mb-3">
                <c.icon className="w-5 h-5 text-[#00D2FF]" />
              </div>
              <div className="flex items-center justify-between">
                <div className="text-base text-white font-semibold">{c.title}</div>
                <span className="text-[10px] text-slate-500">{c.count} makale</span>
              </div>
              <div className="text-xs text-slate-500 mt-1">{c.desc}</div>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="px-6 pb-24">
        <div className="max-w-3xl mx-auto">
          <motion.h2 initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: false, amount: 0.3 }} className="text-3xl md:text-5xl font-bold tracking-tight text-center mb-3" style={{ letterSpacing: '-0.04em' }}>Sıkça Sorulan Sorular</motion.h2>
          <p className="text-center text-slate-400 mb-12">{filtered.length} sonuç</p>
          <div className="space-y-2">
            {filtered.map((f, i) => (
              <motion.div key={f.q} initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: false }} transition={{ delay: i * 0.03 }} className="rounded-2xl border border-white/10 bg-white/[0.02] overflow-hidden">
                <button onClick={() => setOpen(open === i ? -1 : i)} className="w-full flex items-center justify-between gap-3 p-5 text-left hover:bg-white/[0.02] transition-colors">
                  <span className="text-sm md:text-base text-white font-medium">{f.q}</span>
                  <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${open === i ? 'rotate-180' : ''}`} />
                </button>
                <AnimatePresence initial={false}>
                  {open === i && (
                    <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }} className="overflow-hidden">
                      <div className="px-5 pb-5 text-sm text-slate-400 leading-relaxed border-t border-white/5 pt-4">{f.a}</div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
            {filtered.length === 0 && (
              <div className="text-center py-12 text-slate-500 text-sm">Sonuç bulunamadı. Farklı bir anahtar kelime deneyin.</div>
            )}
          </div>
        </div>
      </section>

      <section className="px-6 pb-32">
        <div className="max-w-3xl mx-auto rounded-3xl border border-white/10 bg-gradient-to-b from-white/[0.04] to-transparent p-8 md:p-12 text-center">
          <BookOpen className="w-8 h-8 text-[#00D2FF] mx-auto" />
          <h3 className="mt-4 text-2xl md:text-3xl font-bold tracking-tight" style={{ letterSpacing: '-0.04em' }}>Cevabınızı hala bulamadınız mı?</h3>
          <p className="mt-3 text-slate-400">Ekibimiz canlı. Yanıt süremiz ortalama 2 saat.</p>
          <Link href="/iletisim" className="inline-flex items-center gap-2 mt-6 px-6 py-3 rounded-full bg-white text-black text-sm font-medium hover:scale-105 transition-transform">
            Bize Ulaşın <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      <SiteFooter />
    </main>
  )
}

export default Page
