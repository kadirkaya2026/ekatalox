'use client'

import { useRef, useState } from 'react'
import Link from 'next/link'
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion'
import { EkataloxLogo } from '@/components/brand/ekatalox-logo'
import {
  ArrowRight, Sparkles, DollarSign,
  Check, Zap, Globe, ShieldCheck, BarChart3, Layers,
  HelpCircle, Plus,
  Rocket, TrendingUp, Building2, Crown, Users, Package, CircleCheck, CreditCard,
  X, MessageCircle, Smartphone, PenTool
} from 'lucide-react'
import { formatPlanCapacityFeature, formatVisitorLimit, NEW_PLAN_OPTIONS, PLAN_PRICING } from '@/lib/billing/plans'

// ----------------------------- HERO ------------------------------------------
const Hero = () => {
  const ref = useRef(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] })
  const mockupScale = useTransform(scrollYProgress, [0, 0.5], [1, 0.78])
  const mockupRotateX = useTransform(scrollYProgress, [0, 0.5], [18, 0])
  const mockupY = useTransform(scrollYProgress, [0, 0.5], [60, -40])
  const headlineOpacity = useTransform(scrollYProgress, [0, 0.4], [1, 0.2])
  const headlineY = useTransform(scrollYProgress, [0, 0.4], [0, -60])

  return (
    <section ref={ref} className="relative min-h-[160vh] overflow-hidden">
      {/* Ambient background */}
      <div className="absolute inset-0 bg-[#090d16]" />
      <div className="absolute inset-0 bg-grid mask-radial-fade opacity-60" />
      <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[900px] h-[900px] rounded-full bg-[#10b981]/20 blur-[140px] animate-pulse-glow" />
      <div className="absolute top-40 right-0 w-[600px] h-[600px] rounded-full bg-[#00ff87]/25 blur-[120px]" />
      <div className="absolute top-60 left-0 w-[500px] h-[500px] rounded-full bg-[#10b981]/10 blur-[120px]" />

      {/* Sticky content */}
      <div className="sticky top-0 h-screen flex flex-col items-center justify-start pt-28 md:pt-36 px-6">
        <motion.div
          style={{ opacity: headlineOpacity, y: headlineY }}
          className="text-center max-w-5xl mx-auto z-10"
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass text-xs md:text-sm text-slate-300 mb-8"
          >
            <Rocket className="w-3.5 h-3.5 text-[#10b981]" />
            Türkiye&apos;nin Yeni Nesil B2B Dijital Katalog Platformu
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, scale: 0.92, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
            className="display-headline text-4xl sm:text-5xl md:text-6xl lg:text-7xl text-white text-balance"
          >
            Ürün ve Fiyat Listeni Cebine Taşı, <br />
            <span className="text-gradient-neon">Müşterinden WhatsApp&apos;tan Sipariş Al!</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="mt-7 text-lg md:text-2xl text-slate-400 max-w-3xl mx-auto font-light text-balance"
          >
            Baskı maliyetleri ve ağır PDF&apos;lerle uğraşmaya son. Ürünlerini şık bir dijital vitrinde sergile, müşterilerin tek tıkla sepete ekleyip WhatsApp&apos;tan sipariş geçsin.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <a href="/kayit" className="group relative inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full bg-[#10b981] text-white font-medium text-base hover:scale-[1.03] transition-all duration-300 shadow-[0_0_40px_rgba(16,185,129,0.35)] hover:shadow-[0_0_60px_rgba(16,185,129,0.55)]">
              14 Gün Ücretsiz Deneyin
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
            </a>
            <a href="https://demo.ekatalox.com" target="_blank" rel="noreferrer" className="group inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full glass text-white hover:bg-white/10 transition-all duration-300">
              Örnek Kataloğu İncele
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </a>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.7 }}
            className="mt-6 text-xs md:text-sm text-slate-500"
          >
            Kurulum sadece 5 dakika. Kredi kartı gerekmez. Örnek katalog şifreleri: 1111 - 2222 - 3333
          </motion.p>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.8 }}
            className="mt-2 text-xs md:text-sm text-slate-500"
          >
            Yönetici panelini de deneyin:{" "}
            <a
              href="https://app.ekatalox.com"
              target="_blank"
              rel="noreferrer"
              className="font-medium text-[#10b981] hover:underline"
            >
              app.ekatalox.com
            </a>{" "}
            — demo-admin@ekatalox.com / Demo1234!
          </motion.p>
        </motion.div>

        {/* Storefront mockup */}
        <motion.div
          style={{ scale: mockupScale, rotateX: mockupRotateX, y: mockupY, transformPerspective: 1200 }}
          className="mt-16 md:mt-20 w-full max-w-6xl mx-auto z-10"
        >
          <StorefrontMockup />
        </motion.div>
      </div>
    </section>
  )
}

// ----------------------------- STOREFRONT MOCKUP ------------------------------
const StorefrontMockup = () => {
  return (
    <div className="relative rounded-2xl md:rounded-3xl border border-white/10 bg-gradient-to-b from-slate-900/90 to-[#090d16] shadow-[0_30px_120px_-20px_rgba(16, 185, 129,0.35)] overflow-hidden">
      {/* Browser chrome */}
      <div className="flex items-center gap-2 px-5 py-3 border-b border-white/5 bg-black/20">
        <div className="flex gap-1.5">
          <div className="w-3 h-3 rounded-full bg-red-500/70" />
          <div className="w-3 h-3 rounded-full bg-yellow-500/70" />
          <div className="w-3 h-3 rounded-full bg-green-500/70" />
        </div>
        <div className="flex-1 flex justify-center">
          <div className="px-4 py-1 rounded-md bg-white/5 text-[11px] text-slate-400 flex items-center gap-1.5">
            <Globe className="w-3 h-3" />
            teknomarket.ekatalox.com
          </div>
        </div>
      </div>

      {/* Storefront header */}
      <div className="px-6 py-4 flex items-center justify-between border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#10b981] to-[#00ff87] flex items-center justify-center text-white font-bold text-sm">T</div>
          <span className="text-white font-semibold text-sm">TeknoMarket Toptan</span>
        </div>
        <div className="hidden md:flex items-center gap-6 text-xs text-slate-400">
          <span className="text-white">Tüm Ürünler</span>
          <span>Kategoriler</span>
          <span>Kampanyalar</span>
          <span>İletişim</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="hidden sm:block px-3 py-1.5 rounded-full bg-white/5 text-[11px] text-slate-400 w-40 md:w-56 truncate">Ürün ara…</div>
          <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-xs text-white">B2B</div>
        </div>
      </div>

      {/* Banner area */}
      <div className="px-6 pt-5">
        <div className="aspect-[3/1] rounded-xl overflow-hidden relative bg-gradient-to-br from-[#10b981]/20 via-slate-800 to-[#00ff87]/30 border border-white/5">
          <div className="absolute inset-0 bg-grid opacity-30" />
          <div className="absolute inset-0 flex flex-col justify-center px-8">
            <span className="text-[10px] text-[#10b981] uppercase tracking-widest font-semibold">Yaz Kampanyası</span>
            <span className="text-xl md:text-3xl font-bold text-white mt-1">Aksesuar Kategorisinde %30'a Varan İndirim</span>
          </div>
          <div className="absolute right-6 top-1/2 -translate-y-1/2 w-24 h-24 md:w-32 md:h-32 rounded-full bg-[#10b981]/40 blur-2xl" />
        </div>
      </div>

      {/* Product grid */}
      <div className="p-6 grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        {[
          { n: 'Wireless Hoparlör Pro', p: '₺1.249', stock: 'Stokta' },
          { n: 'Hızlı Duvar Şarjı 65W', p: '₺389', stock: 'Stokta' },
          { n: 'USB-C Kablo 2m', p: '₺79', stock: 'Stokta' },
          { n: 'Powerbank 20.000mAh', p: '₺549', stock: 'Sınırlı' },
        ].map((p, i) => (
          <div key={i} className="rounded-xl border border-white/5 bg-white/[0.02] p-3 hover:border-[#10b981]/30 transition-colors">
            <div className="aspect-square rounded-lg bg-gradient-to-br from-slate-700/30 to-slate-900 mb-3 relative overflow-hidden">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-12 h-12 rounded-lg bg-white/5 flex items-center justify-center">
                  <Layers className="w-5 h-5 text-slate-500" />
                </div>
              </div>
              <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded-md bg-[#10b981]/15 text-[9px] text-[#10b981] font-medium">{p.stock}</div>
            </div>
            <div className="text-[11px] text-white font-medium truncate">{p.n}</div>
            <div className="flex items-center justify-between mt-1">
              <span className="text-xs text-[#10b981] font-semibold">{p.p}</span>
              <span className="text-[9px] text-slate-500">1. Fiyat</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ----------------------------- PROBLEM & ÇÖZÜM --------------------------------
const ProblemSolution = () => {
  const rows = [
    ['Binlerce TL harcanan baskı kataloglar', 'Sıfır matbaa maliyeti, anında dijital yayın'],
    ['Fiyat değiştiğinde çöpe giden binlerce sayfa', 'Tek tıkla anında fiyat ve stok güncelleme'],
    ["WhatsApp'tan resim/fiyat arama karmaşası", 'Tek linkle tüm dükkanı müşteriye gönderme'],
    ['Müşterinin tek tek ürün kodu yazması', 'Sepete ekleyip derli toplu WhatsApp siparişi'],
  ]

  return (
    <section className="relative py-28 md:py-40 px-6">
      <div className="absolute top-1/3 left-0 w-[500px] h-[500px] rounded-full bg-[#10b981]/10 blur-[160px] pointer-events-none" />
      <div className="max-w-5xl mx-auto relative">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false, amount: 0.3 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-14 md:mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass text-xs text-slate-300 mb-6">
            <Zap className="w-3 h-3 text-[#10b981]" />
            Neden eKatalox?
          </div>
          <h2 className="display-headline text-4xl md:text-6xl text-white text-balance">
            Eski usül katalog <br />
            <span className="text-gradient-neon">yönetimi bitti.</span>
          </h2>
        </motion.div>

        <div className="rounded-3xl border border-white/10 overflow-hidden">
          <div className="grid grid-cols-2">
            <div className="px-5 md:px-8 py-4 bg-white/[0.03] border-b border-r border-white/10 flex items-center gap-2">
              <X className="w-4 h-4 text-red-400" />
              <span className="text-sm md:text-base font-semibold text-slate-300">Eski Yöntem</span>
            </div>
            <div className="px-5 md:px-8 py-4 bg-[#10b981]/10 border-b border-white/10 flex items-center gap-2">
              <Check className="w-4 h-4 text-[#10b981]" />
              <span className="text-sm md:text-base font-semibold text-white">eKatalox Yolu</span>
            </div>
          </div>
          {rows.map(([bad, good], i) => (
            <motion.div
              key={bad}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: false, amount: 0.3 }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              className="grid grid-cols-2"
            >
              <div className={`px-5 md:px-8 py-5 md:py-6 border-r border-white/10 text-sm md:text-base text-slate-400 ${i < rows.length - 1 ? 'border-b border-white/5' : ''}`}>
                {bad}
              </div>
              <div className={`px-5 md:px-8 py-5 md:py-6 bg-[#10b981]/[0.04] text-sm md:text-base text-white ${i < rows.length - 1 ? 'border-b border-white/5' : ''}`}>
                {good}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ----------------------------- FEATURES ---------------------------------------
const Features = () => {
  const features = [
    {
      icon: Smartphone,
      title: 'Işık Hızında Dijital Vitrin',
      desc: "Ağır PDF'ler yok. Mobil uyumlu, saniyesinde açılan ve markanıza özel alan adı (ör. katalog.firmam.com) bağlayabileceğiniz şık katalog.",
    },
    {
      icon: MessageCircle,
      title: 'WhatsApp İle Tek Tıkla Sipariş',
      desc: 'Müşterileriniz ürünlerinizi inceler, seçtiklerini sepete atar ve sipariş listesi derli toplu şekilde doğrudan WhatsApp’ınıza düşer.',
    },
    {
      icon: PenTool,
      title: 'Kolay Ürün & Varyant Yönetimi',
      desc: 'Cep telefonunuzdan bile yeni ürün ekleyin, renk/beden/ölçü seçeneği tanımlayın, stok ve fiyatları anında güncelleyin.',
    },
    {
      icon: CreditCard,
      title: 'Kredi Kartı ile B2B Tahsilat',
      desc: 'Sanal POS entegrasyonu sayesinde bayilerinizden ve müşterilerinizden 12 aya varan taksit imkanıyla güvenle ödeme alın.',
    },
    {
      icon: BarChart3,
      title: 'Canlı Müşteri & Ziyaretçi Analitiği',
      desc: 'Hangi ürünlerinizin daha çok incelendiğini, aylık kaç ziyaretçi aldığınızı yönetim panelinizden canlı izleyin.',
    },
    {
      icon: ShieldCheck,
      title: 'Kesintisiz ve Güvenli Altyapı',
      desc: 'Yüksek hızlı cloud altyapımız sayesinde 500.000 ziyaretçiye kadar mağazanız hiçbir zaman kapanmaz, jet hızında çalışır.',
    },
  ]

  return (
    <section id="ozellikler" className="relative py-28 md:py-40 px-6">
      <div className="absolute top-1/4 right-0 w-[500px] h-[500px] rounded-full bg-[#00ff87]/10 blur-[140px] pointer-events-none" />
      <div className="max-w-7xl mx-auto relative">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false, amount: 0.3 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16 md:mb-20"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass text-xs text-slate-300 mb-6">
            <Sparkles className="w-3 h-3 text-[#10b981]" />
            eKatalox Ne Sağlar?
          </div>
          <h2 className="display-headline text-4xl md:text-6xl text-white text-balance">
            Dükkanınızı dijitalleştiren <br />
            <span className="text-gradient-neon">6 güçlü özellik.</span>
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: false, amount: 0.2 }}
              transition={{ duration: 0.6, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] }}
              whileHover={{ y: -4 }}
              className="group relative p-7 md:p-8 rounded-3xl border border-white/10 bg-gradient-to-b from-white/[0.04] to-white/[0.01] hover:border-[#10b981]/40 transition-all duration-500"
            >
              <div className="w-12 h-12 rounded-2xl bg-[#10b981]/10 flex items-center justify-center mb-5 group-hover:bg-[#10b981]/20 transition-colors">
                <f.icon className="w-6 h-6 text-[#10b981]" />
              </div>
              <h3 className="text-lg md:text-xl font-semibold text-white">{f.title}</h3>
              <p className="mt-3 text-sm md:text-base text-slate-400 leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ----------------------------- FAQ -------------------------------------------
const FAQ = () => {
  const faqs = [
    {
      q: 'eKatalox’u kullanmak için yazılım bilgisi gerekiyor mu?',
      a: 'Hayır! Sosyal medyaya fotoğraf yüklemek kadar kolay bir panelimiz var. 5 dakika içinde ürünlerinizi ekleyip satışa başlayabilirsiniz.',
    },
    {
      q: 'Kendi özel web adresimi (domain) kullanabilir miyim?',
      a: 'Evet! Dilerseniz katalog.sirketiniz.com şeklinde kendi alan adınızı ek ücret ödemeden sistemimize bağlayabilirsiniz.',
    },
    {
      q: 'Müşterilerimin siparişleri bana nasıl ulaşıyor?',
      a: 'Müşteriniz kataloğunuzdan ürünleri seçip "Sipariş Ver" dediğinde, seçtiği ürünlerin adı, adedi ve toplam tutarı otomatik olarak WhatsApp hattınıza mesaj olarak gelir.',
    },
  ]
  const [open, setOpen] = useState(0)

  return (
    <section id="faq" className="relative py-28 md:py-40 px-6">
      <div className="absolute top-1/2 left-1/3 w-[500px] h-[500px] rounded-full bg-[#10b981]/10 blur-[160px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] rounded-full bg-[#00ff87]/10 blur-[140px] pointer-events-none" />
      <div className="max-w-3xl mx-auto relative">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false, amount: 0.3 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-14"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass text-xs text-slate-300 mb-6">
            <HelpCircle className="w-3 h-3 text-[#10b981]" />
            Sıkça Sorulan Sorular
          </div>
          <h2 className="display-headline text-4xl md:text-5xl lg:text-6xl text-white text-balance">
            Aklınızdaki sorular, <br />
            <span className="text-gradient-neon">net cevaplar.</span>
          </h2>
        </motion.div>

        <div className="space-y-3">
          {faqs.map((f, i) => (
            <motion.div
              key={f.q}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: false, amount: 0.3 }}
              transition={{ duration: 0.5, delay: i * 0.06 }}
              className={`rounded-2xl border bg-gradient-to-b overflow-hidden transition-colors ${
                open === i
                  ? 'border-[#10b981]/40 from-[#10b981]/[0.06] to-transparent'
                  : 'border-white/10 from-white/[0.03] to-transparent hover:border-white/20'
              }`}
            >
              <button
                onClick={() => setOpen(open === i ? -1 : i)}
                className="w-full flex items-center justify-between gap-4 p-5 md:p-6 text-left"
              >
                <span className="text-base md:text-lg text-white font-medium pr-2">{f.q}</span>
                <motion.div
                  animate={{ rotate: open === i ? 45 : 0 }}
                  transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                  className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${
                    open === i ? 'bg-gradient-to-br from-[#10b981] to-[#00ff87] text-white' : 'bg-white/5 text-slate-400'
                  }`}
                >
                  <Plus className="w-3.5 h-3.5" strokeWidth={2.5} />
                </motion.div>
              </button>
              <AnimatePresence initial={false}>
                {open === i && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                    className="overflow-hidden"
                  >
                    <div className="px-5 md:px-6 pb-6 text-sm md:text-base text-slate-400 leading-relaxed">
                      {f.a}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: false }}
          transition={{ delay: 0.4 }}
          className="mt-12 text-center text-sm text-slate-500"
        >
          Cevabını bulamadığınız bir sorunuz mu var? <a href="/iletisim" className="text-white hover:text-[#10b981] underline-offset-4 hover:underline">Bizimle iletişime geçin →</a>
        </motion.div>
      </div>
    </section>
  )
}

// ----------------------------- PRICING ---------------------------------------
const PLAN_ICONS = { start: Rocket, pro: CircleCheck, business: TrendingUp, enterprise: Building2, vip: Crown }

const PLAN_MARKETING_META = {
  start: {
    tag: 'Giriş Paketi',
    desc: 'Vitrin fikrinizi test edin. Kredi kartı gerekmez.',
    cta: 'Hemen Başlayın',
    featured: false,
    features: [
      "Excel'den 1 Dakikada Canlı Vitrin",
      '3 Seviyeli Müşteri Fiyat Listesi (Bayi / Toptan / Perakende)',
      'Optimize WhatsApp Sipariş Formu (Yapılandırılmış B2B Sipariş Akışı)',
      'Otomatik Kur Senkronizasyonu (USD/EUR/TRY)',
      'ekatalox.com Subdomain Adresi',
      'Kodsuz (No-Code) Altyapı · Sıfır Yazılımcı Bağımlılığı',
    ],
  },
  pro: {
    tag: 'Büyüyen Vitrinler',
    desc: 'Excel kaosundan kurtulup büyümeye odaklanın.',
    cta: "Pro'yu Seç",
    featured: false,
    features: [
      '5 Seviyeli Müşteri Fiyat Listesi',
      'Raporlar & Ürün İndirimi',
      '3:1 Akıllı Banner Alanı (Tasarımcı/Ajans Gerektirmez)',
      'Tüm Start Özellikleri Dahil',
    ],
  },
  business: {
    tag: 'En Çok Tercih Edilen',
    desc: 'Büyüyen toptancılar için tam donanım B2B vitrin.',
    cta: "Business'ı Seç",
    featured: true,
    features: [
      '10 Seviyeli Müşteri Fiyat Listesi',
      'Özel Domain Desteği (katalog.sirketiniz.com)',
      'Akıllı Stok Durum Yönetimi (Stokta Var / Azaldı / Tükendi)',
      'Hızlı Teknik Destek Hattı (2 Saat İçinde Çözüm Garantisi)',
      'Tüm Pro Özellikleri Dahil',
    ],
  },
  enterprise: {
    tag: 'Kurumsal Ölçek',
    desc: 'Yüksek hacimli operasyonlar için tam donanım.',
    cta: 'Satışla Görüşün',
    featured: false,
    features: [
      '20 Seviyeli Müşteri Fiyat Listesi',
      'Online Sanal POS Ödemesi (iyzico/PayTR)',
      'Öncelikli Teknik Destek Hattı',
      'Tüm Business Özellikleri Dahil',
    ],
  },
  vip: {
    tag: 'Özel Çözüm',
    desc: 'Size özel yapılandırılmış, white-label kurumsal çözüm.',
    cta: 'Satışla Görüşün',
    featured: false,
    features: [
      'Akıllı Stok Yönetimi & Sınırsız Fiyat Listesi',
      'Saha Satış Temsilcisi (Plasiyer) Modülü',
      'White-Label Desteği (Kendi Markanızla Sunum)',
      'Özel Onboarding ve Hesap Yöneticisi',
      'Tüm Enterprise Özellikleri Dahil',
    ],
  },
}

const Pricing = () => {
  const [billing, setBilling] = useState('yearly')

  const plans = NEW_PLAN_OPTIONS.map((option) => {
    const meta = PLAN_MARKETING_META[option.id as keyof typeof PLAN_MARKETING_META]
    const pricing = PLAN_PRICING[option.id]
    return {
      id: option.id,
      name: option.name,
      icon: PLAN_ICONS[option.id as keyof typeof PLAN_ICONS],
      price: billing === 'yearly' ? pricing.price : pricing.monthlyPrice,
      unit: billing === 'yearly' ? pricing.unit : pricing.monthlyUnit,
      productCapacity: formatPlanCapacityFeature(option.id),
      visitorCapacity: `${formatVisitorLimit(option.id)} Aylık Ziyaretçi`,
      ...meta,
    }
  })

  return (
    <section id="fiyatlandirma" className="relative py-32 md:py-44 px-6">
      <div className="absolute top-1/4 right-1/4 w-[500px] h-[500px] rounded-full bg-[#00ff87]/15 blur-[160px] pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-[500px] h-[500px] rounded-full bg-[#10b981]/10 blur-[160px] pointer-events-none" />
      <div className="max-w-7xl mx-auto relative">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false, amount: 0.3 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-10 md:mb-12"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass text-xs text-slate-300 mb-6">
            <DollarSign className="w-3 h-3 text-[#10b981]" />
            Fiyatlandırma
          </div>
          <h2 className="display-headline text-4xl md:text-6xl lg:text-7xl text-white text-balance">
            eKatalox B2B Fiyatlandırma Paketleri <br />
            <span className="text-gradient-neon">Yıllık ve Aylık Seçenekler.</span>
          </h2>
          <p className="mt-6 text-lg md:text-xl text-slate-400 max-w-2xl mx-auto font-light">
            İhtiyacınıza uygun planı seçin.
          </p>
          <div className="mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[#10b981]/40 bg-[#10b981]/10 text-sm text-white">
            <CreditCard className="w-4 h-4 text-[#10b981]" />
            Kredi Kartına 12 Aya Varan Taksit İmkanı!
            <span className="text-slate-400 font-light">(3 taksite kadar vade farksız)</span>
          </div>
        </motion.div>

        <div className="flex items-center justify-center mb-16 md:mb-20">
          <div className="inline-flex items-center gap-1 p-1 rounded-full glass">
            {[
              { key: 'yearly', label: 'Yıllık' },
              { key: 'monthly', label: 'Aylık' },
            ].map((opt) => (
              <button
                key={opt.key}
                type="button"
                onClick={() => setBilling(opt.key)}
                className={`relative px-5 py-2 rounded-full text-sm font-medium transition-colors duration-300 ${
                  billing === opt.key ? 'text-black' : 'text-slate-300 hover:text-white'
                }`}
              >
                {billing === opt.key && (
                  <motion.span
                    layoutId="billing-toggle-pill"
                    className="absolute inset-0 rounded-full bg-white"
                    transition={{ type: 'spring', duration: 0.5 }}
                  />
                )}
                <span className="relative">{opt.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-5 lg:gap-4">
          {plans.map((p, i) => (
            <PricingCard key={p.id} plan={p} index={i} />
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: false }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="mt-12 text-center text-sm text-slate-500"
        >
          Tüm planlar 14 gün ücretsiz denemeyle başlar · Fiyatlara KDV dahil değildir. Kredi kartına 12 aya varan taksit imkanı.
        </motion.div>
      </div>
    </section>
  )
}

const PricingCard = ({ plan, index }) => {
  const Icon = plan.icon
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: false, amount: 0.2 }}
      transition={{ duration: 0.7, delay: index * 0.1, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ y: -8 }}
      className={`group relative rounded-3xl p-px overflow-hidden transition-all duration-500 ${
        plan.featured ? 'lg:-mt-6 lg:mb-6' : ''
      }`}
    >
      {plan.featured && (
        <>
          <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-[#10b981] via-[#00ff87] to-[#10b981] opacity-90" />
          <div className="absolute -inset-1 rounded-3xl bg-gradient-to-br from-[#10b981]/40 to-[#00ff87]/40 blur-2xl opacity-60 group-hover:opacity-100 transition-opacity duration-500" />
        </>
      )}
      {!plan.featured && (
        <div className="absolute inset-0 rounded-3xl border border-white/10 group-hover:border-white/20 transition-colors duration-500" />
      )}

      <div className={`relative rounded-3xl bg-[#090d16] p-6 md:p-7 h-full flex flex-col`}>
        <div className="relative flex items-center justify-between mb-4">
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-medium uppercase tracking-wider ${
            plan.featured
              ? 'bg-gradient-to-r from-[#10b981] to-[#00ff87] text-white'
              : 'bg-white/5 text-slate-400'
          }`}>
            {plan.featured && <Sparkles className="w-3 h-3" />}
            {plan.tag}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {Icon && <Icon className={`w-5 h-5 ${plan.featured ? 'text-[#10b981]' : 'text-slate-400'}`} />}
          <h3 className="text-xl md:text-2xl font-semibold text-white">{plan.name}</h3>
        </div>
        <p className="mt-2 text-sm text-slate-400 min-h-[40px]">{plan.desc}</p>

        <div className="mt-4 flex items-baseline gap-2">
          <span className={`text-3xl md:text-4xl font-bold tracking-tight ${plan.featured ? 'text-gradient-neon' : 'text-white'}`}>
            {plan.price}
          </span>
          <span className="text-sm text-slate-500">{plan.unit}</span>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/5 text-[11px] text-slate-300">
            <Package className="w-3 h-3 text-[#10b981]" />
            {plan.productCapacity}
          </span>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/5 text-[11px] text-slate-300">
            <Users className="w-3 h-3 text-[#10b981]" />
            {plan.visitorCapacity}
          </span>
        </div>

        <div className="my-6 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

        <ul className="space-y-3 flex-1">
          {plan.features.map((f, i) => {
            const isInherit = /Tüm .+ Dahil$/i.test(f)
            return (
              <li key={i} className={`flex items-start gap-2.5 text-sm ${isInherit ? 'text-white font-semibold pt-3 mt-2 border-t border-white/10' : 'text-slate-300'}`}>
                <div className={`mt-0.5 w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 ${
                  isInherit ? 'bg-emerald-500/25' : plan.featured ? 'bg-[#10b981]/20' : 'bg-white/5'
                }`}>
                  <Check className={`w-2.5 h-2.5 ${isInherit ? 'text-emerald-300' : plan.featured ? 'text-[#10b981]' : 'text-emerald-400'}`} strokeWidth={3} />
                </div>
                {f}
              </li>
            )
          })}
        </ul>

        <a
          href="/kayit"
          className={`mt-8 inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full font-medium text-sm transition-all duration-300 ${
            plan.featured
              ? 'bg-white text-black hover:scale-[1.02] shadow-[0_0_40px_rgba(16, 185, 129,0.3)]'
              : 'glass text-white hover:bg-white/10'
          }`}
        >
          {plan.cta}
          <ArrowRight className="w-4 h-4" />
        </a>
      </div>
    </motion.div>
  )
}

// ----------------------------- FINAL CTA + FOOTER ---------------------------
const FinalCTA = () => (
  <section id="baslat" className="relative py-40 md:py-56 px-6 overflow-hidden">
    <div className="absolute inset-0">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[900px] rounded-full bg-[#00ff87]/20 blur-[160px]" />
      <div className="absolute top-1/3 left-1/4 w-[500px] h-[500px] rounded-full bg-[#10b981]/15 blur-[140px]" />
    </div>
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: false, amount: 0.3 }}
      transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
      className="max-w-5xl mx-auto text-center relative"
    >
      <h2 className="display-headline text-5xl sm:text-6xl md:text-7xl lg:text-8xl text-white text-balance">
        Dükkanınızı Dijitale Taşımak İçin <br />
        <span className="text-gradient-neon">Daha Ne Bekliyorsunuz?</span>
      </h2>
      <p className="mt-8 text-lg md:text-2xl text-slate-400 font-light max-w-2xl mx-auto">
        Hemen bugün ücretsiz hesabınızı oluşturun, ürünlerinizi sergilemeye başlayın.
      </p>
      <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-4">
        <a href="/kayit" className="group inline-flex items-center gap-2 px-10 py-5 rounded-full bg-[#10b981] text-white font-medium text-base hover:scale-[1.03] transition-all duration-300 shadow-[0_0_60px_rgba(16,185,129,0.35)] hover:shadow-[0_0_80px_rgba(16,185,129,0.55)]">
          Ücretsiz Demoyu Başlat
          <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
        </a>
        <a href="/iletisim" className="text-slate-400 hover:text-white transition-colors text-sm">veya satış ekibimizle konuşun →</a>
      </div>
    </motion.div>
  </section>
)

const Footer = () => (
  <footer className="relative border-t border-white/5 bg-[#090d16]">
    <div className="neon-line" />
    <div className="max-w-7xl mx-auto px-6 py-16 md:py-20">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-10">
        <div className="col-span-2">
          <Link href="/#top" className="flex items-center gap-2">
            <EkataloxLogo className="h-10 w-[180px]" />
          </Link>
          <p className="mt-4 text-sm text-slate-400 max-w-xs">
            Toptancılar ve distribütörler için yeni nesil B2B vitrin platformu. Excel'den canlı dijital kataloğa.
          </p>
          <div className="mt-6 flex gap-3">
            <Link href="/login" className="px-4 py-2 rounded-full glass text-xs text-white hover:bg-white/10 transition-colors">Workspace Giriş</Link>
            <Link href="/kayit" className="px-4 py-2 rounded-full bg-white text-black text-xs font-medium hover:scale-105 transition-transform">Ücretsiz Başla</Link>
          </div>
        </div>

        <FooterCol title="Ürün" items={[['Özellikler','#ozellikler'], ['Fiyatlandırma','#fiyatlandirma'], ['Örnek Katalog','https://demo.ekatalox.com'], ['Yenilikler','/yenilikler'], ['Yol Haritası','/yenilikler']]} />
        <FooterCol title="Şirket" items={[['Hakkımızda','/hakkimizda'], ['Müşteriler','/musteriler'], ['İletişim','/iletisim'], ['Kariyer','/hakkimizda'], ['Basın','/iletisim']]} />
        <FooterCol title="Destek" items={[['Dokümantasyon','/yardim'], ['Yardım Merkezi','/yardim'], ['API','/yardim'], ['Durum','/yardim'], ['İletişim','/iletisim']]} />
      </div>

      <div className="mt-16 pt-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-500">
        <div>© 2026 eKatalox. Tüm hakları saklıdır. Kurumsal Toptancı ve B2B Dijital Katalog Platformu.</div>
        <div className="flex gap-6">
          <Link href="/kullanim-sartlari" className="hover:text-white">Kullanım Şartları</Link>
          <Link href="/gizlilik-ve-kvkk" className="hover:text-white">Gizlilik ve KVKK</Link>
        </div>
      </div>
    </div>
  </footer>
)

const FooterCol = ({ title, items }) => (
  <div>
    <h4 className="text-xs font-semibold text-white uppercase tracking-wider">{title}</h4>
    <ul className="mt-4 space-y-3">
      {items.map(([label, href]) => (
        <li key={label}>
          {href?.startsWith('/') ? (
            <Link href={href} className="text-sm text-slate-400 hover:text-white transition-colors">{label}</Link>
          ) : (
            <a href={href} className="text-sm text-slate-400 hover:text-white transition-colors">{label}</a>
          )}
        </li>
      ))}
    </ul>
  </div>
)

// ----------------------------- NAVBAR ----------------------------------------
const Navbar = () => (
  <nav className="fixed top-0 left-0 right-0 z-50">
    <div className="backdrop-blur-xl bg-[#090d16]/60 border-b border-white/5">
      <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
        <Link href="/#top" className="flex items-center gap-2">
          <EkataloxLogo className="h-8 w-[148px]" priority />
        </Link>
        <div className="hidden md:flex items-center gap-8 text-sm text-slate-300">
          <a href="#ozellikler" className="hover:text-white transition-colors">Özellikler</a>
          <Link href="/musteriler" className="hover:text-white transition-colors">Müşteriler</Link>
          <a href="#fiyatlandirma" className="hover:text-white transition-colors">Fiyatlandırma</a>
          <a href="#faq" className="hover:text-white transition-colors">SSS</a>
          <Link href="/iletisim" className="hover:text-white transition-colors">İletişim</Link>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/login" className="text-sm text-slate-300 hover:text-white">Giriş</Link>
          <Link href="/kayit" className="px-4 py-1.5 rounded-full bg-white text-black text-sm font-medium hover:scale-105 transition-transform">Başla</Link>
        </div>
      </div>
    </div>
  </nav>
)

// ----------------------------- ROOT ------------------------------------------
// Arama motorları için yapılandırılmış veri; client bileşeni de olsa SSR
// çıktısındaki ilk HTML'e gömülür.
const structuredData = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      '@id': 'https://www.ekatalox.com/#organization',
      name: 'eKatalox',
      url: 'https://www.ekatalox.com',
      logo: 'https://www.ekatalox.com/ekatalox-logo-v2.png',
    },
    {
      '@type': 'WebSite',
      '@id': 'https://www.ekatalox.com/#website',
      name: 'eKatalox',
      url: 'https://www.ekatalox.com',
      publisher: { '@id': 'https://www.ekatalox.com/#organization' },
      inLanguage: 'tr',
    },
    {
      '@type': 'SoftwareApplication',
      name: 'eKatalox',
      applicationCategory: 'BusinessApplication',
      operatingSystem: 'Web',
      description:
        'Toptancılar ve distribütörler için B2B sipariş ve dijital katalog platformu. Şifre korumalı katalog, bayiye özel fiyat listeleri, Excel\'den ürün yükleme.',
      url: 'https://www.ekatalox.com',
      inLanguage: 'tr',
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'TRY',
        description: 'Ücretsiz kayıt',
      },
    },
  ],
}

const App = () => {
  return (
    <main id="top" className="relative bg-[#090d16] text-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <Navbar />
      <Hero />
      <ProblemSolution />
      <Features />
      <Pricing />
      <FAQ />
      <FinalCTA />
      <Footer />
    </main>
  )
}

export default App
