"use client";

import Link from "next/link";
import type { FormEvent, ReactNode } from "react";
import { useRef, useState } from "react";
import {
  AnimatePresence,
  LayoutGroup,
  motion,
  useScroll,
  useTransform,
} from "framer-motion";
import {
  ArrowRight,
  BarChart3,
  Check,
  CheckCircle2,
  DollarSign,
  FileSpreadsheet,
  FileUp,
  Globe,
  Image as ImageIcon,
  Layers,
  Move,
  RefreshCw,
  Search,
  ShieldCheck,
  ShoppingCart,
  Sparkles,
  Upload,
  Zap,
} from "lucide-react";
import { EkataloxLogo } from "@/components/brand/ekatalox-logo";

type SimulatorState = "idle" | "processing" | "ready";
type CategoryId = "hoparlor" | "sarj" | "kablo" | "powerbank";

const navItems = [
  { label: "Demo", href: "#demo" },
  { label: "Karşılaştırma", href: "#karsilastirma" },
  { label: "Fiyatlandırma", href: "#fiyatlandirma" },
  { label: "SSS", href: "#faq" },
];

const simulatorPhases = [
  {
    label: "Excel dosyası okunuyor...",
    subLabel: "Sütunlar ve başlıklar analiz ediliyor",
  },
  {
    label: "Ürün verileri temizleniyor...",
    subLabel: "Para birimleri ve kategori alanları normalize ediliyor",
  },
  {
    label: "Vitrin hazırlanıyor...",
    subLabel: "Ürün kartları ve koleksiyon görünümü oluşturuluyor",
  },
];

const categoryTabs: Array<{ id: CategoryId; label: string; count: number }> = [
  { id: "hoparlor", label: "Hoparlör", count: 4 },
  { id: "sarj", label: "Şarj", count: 4 },
  { id: "kablo", label: "Kablo", count: 4 },
  { id: "powerbank", label: "Powerbank", count: 4 },
];

const productMap: Record<
  CategoryId,
  Array<{ id: string; name: string; price: string; stock: number }>
> = {
  hoparlor: [
    { id: "sp-1", name: "SoundWave Pro X", price: "₺1.899", stock: 124 },
    { id: "sp-2", name: "BassBoom Mini", price: "₺749", stock: 87 },
    { id: "sp-3", name: "StudioMax 360", price: "₺2.450", stock: 12 },
    { id: "sp-4", name: "EchoCore Slim", price: "₺1.149", stock: 56 },
  ],
  sarj: [
    { id: "ch-1", name: "GaN Hızlı Şarj 65W", price: "₺389", stock: 230 },
    { id: "ch-2", name: "Çoklu Port 100W", price: "₺649", stock: 78 },
    { id: "ch-3", name: "Type-C 30W Mini", price: "₺199", stock: 412 },
    { id: "ch-4", name: "MagSafe Wireless", price: "₺259", stock: 145 },
  ],
  kablo: [
    { id: "cb-1", name: "USB-C Naylon 2m", price: "₺79", stock: 520 },
    { id: "cb-2", name: "Lightning MFi 1m", price: "₺59", stock: 318 },
    { id: "cb-3", name: "USB-C 240W Pro", price: "₺119", stock: 67 },
    { id: "cb-4", name: "HDMI 4K 1.5m", price: "₺99", stock: 201 },
  ],
  powerbank: [
    { id: "pw-1", name: "Powerbank 20.000", price: "₺549", stock: 184 },
    { id: "pw-2", name: "MagSafe 10.000", price: "₺699", stock: 92 },
    { id: "pw-3", name: "Slim Cep 5.000", price: "₺249", stock: 267 },
    { id: "pw-4", name: "Pro 30.000 100W", price: "₺899", stock: 41 },
  ],
};

const pricingPlans = [
  {
    name: "Launch",
    tag: "Yeni Başlayanlar",
    price: "₺20.000",
    unit: "/ yıl",
    featured: false,
    description: "Tek katalog, hızlı kurulum ve temel B2B vitrin.",
    items: [
      "300 ürün kapasitesi",
      "Şifreli fiyat görünürlüğü",
      "Excel ile içe aktarma",
      "Tek tenant vitrin kurulumu",
    ],
  },
  {
    name: "Growth",
    tag: "En çok tercih edilen",
    price: "₺45.000",
    unit: "/ yıl",
    featured: true,
    description: "Satış ekibi büyüyen toptancılar için tam vitrin deneyimi.",
    items: [
      "1.000 ürün kapasitesi",
      "Demo ve fiyat katmanı simülasyonu",
      "Banner ve koleksiyon yönetimi",
      "Öncelikli onboarding desteği",
    ],
  },
  {
    name: "Scale",
    tag: "Kurumsal ekipler",
    price: "₺95.000",
    unit: "/ yıl",
    featured: false,
    description: "Birden fazla marka ve ekip için premium deneyim.",
    items: [
      "Çoklu tenant yapısı",
      "Yüksek hacimli katalog yönetimi",
      "Özel onboarding akışı",
      "Kurumsal destek ve planlama",
    ],
  },
];

const faqItems = [
  {
    question: "Gerçek backend entegrasyonu var mı?",
    answer:
      "Bu landing entegrasyonunda form, demo ve yükleme akışı tamamen front-end üzerinde simüle edilir. Üretim backend bağlantısı daha sonra ayrı olarak eklenebilir.",
  },
  {
    question: "Excel simülatörü gerçek dosya yükler mi?",
    answer:
      "Hayır. Kullanıcı deneyimini göstermek için dosya adı okunur ve sonuç ekranı mock verilerle hazırlanır.",
  },
  {
    question: "Kırık yönlendirmeler kaldırıldı mı?",
    answer:
      "Evet. Navbar, CTA ve footer bağlantıları yalnızca geçerli section anchor hedeflerine gider.",
  },
  {
    question: "Waitlist formu nasıl çalışıyor?",
    answer:
      "Form gönderildiğinde sayfa yenilenmez. E-posta doğrulanır, ardından başarı animasyonu ve sabit sıra numarası gösterilir.",
  },
];

const comparisonRows = [
  {
    label: "Kurulum Süresi",
    ekatalox: "Dakikalar",
    classic: "Günler / haftalar",
    manual: "Her seferinde baştan",
  },
  {
    label: "Ürün Güncelleme",
    ekatalox: "Excel ile toplu",
    classic: "Panelde tek tek",
    manual: "PDF / WhatsApp revizyonu",
  },
  {
    label: "Fiyat Katmanları",
    ekatalox: "3 seviye B2B görünüm",
    classic: "Ek geliştirme gerekir",
    manual: "Elle paylaşım",
  },
  {
    label: "Demo Etkisi",
    ekatalox: "Canlı vitrin hissi",
    classic: "Standart e-ticaret akışı",
    manual: "Statik katalog",
  },
];

export default function HomepageLanding() {
  return (
    <main
      id="top"
      className="ek-homepage relative overflow-hidden bg-[#0B0F19] text-white"
    >
      <LandingNavbar />
      <HeroSection />
      <ExcelSimulatorSection />
      <FeatureGridSection />
      <ComparisonSection />
      <PricingSection />
      <FaqSection />
      <WaitlistSection />
      <FinalCtaSection />
      <LandingFooter />
    </main>
  );
}

function LandingNavbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50">
      <div className="border-b border-white/5 bg-[#0B0F19]/70 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <Link href="/#top" className="flex items-center gap-2">
            <EkataloxLogo className="h-8 w-[148px]" priority />
          </Link>

          <div className="hidden items-center gap-8 text-sm text-slate-300 md:flex">
            {navItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="transition-colors hover:text-white"
              >
                {item.label}
              </a>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <a
              href="#demo"
              className="hidden text-sm text-slate-300 transition-colors hover:text-white sm:inline"
            >
              Canlı Demo
            </a>
            <a
              href="#waitlist"
              className="rounded-full bg-white px-4 py-2 text-sm font-medium text-black transition-transform hover:scale-105"
            >
              Erken Erişim
            </a>
          </div>
        </div>
      </div>
    </nav>
  );
}

function HeroSection() {
  const heroRef = useRef<HTMLElement | null>(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const mockupScale = useTransform(scrollYProgress, [0, 0.5], [1, 0.82]);
  const mockupRotateX = useTransform(scrollYProgress, [0, 0.5], [14, 0]);
  const mockupTranslateY = useTransform(scrollYProgress, [0, 0.5], [40, -20]);
  const titleOpacity = useTransform(scrollYProgress, [0, 0.35], [1, 0.25]);
  const titleTranslateY = useTransform(scrollYProgress, [0, 0.35], [0, -40]);

  return (
    <section
      ref={heroRef}
      className="relative min-h-[145vh] overflow-hidden"
    >
      <div className="absolute inset-0 bg-[#0B0F19]" />
      <div className="bg-grid mask-radial-fade absolute inset-0 opacity-60" />
      <div className="animate-pulse-glow absolute -top-40 left-1/2 h-[900px] w-[900px] -translate-x-1/2 rounded-full bg-[#00D2FF]/15 blur-[140px]" />
      <div className="absolute top-32 right-0 h-[520px] w-[520px] rounded-full bg-[#7928CA]/20 blur-[120px]" />
      <div className="absolute left-0 top-80 h-[420px] w-[420px] rounded-full bg-[#00D2FF]/10 blur-[120px]" />

      <div className="sticky top-0 flex h-screen flex-col items-center justify-start px-6 pt-28 md:pt-36">
        <motion.div
          style={{ opacity: titleOpacity, y: titleTranslateY }}
          className="z-10 mx-auto max-w-5xl text-center"
        >
          <div className="glass mb-8 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs text-slate-300 md:text-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-[#00D2FF]" />
            Apple tarzı B2B lansman deneyimi
          </div>

          <motion.h1
            initial={{ opacity: 0, scale: 0.92, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
            className="display-headline text-balance text-5xl text-white sm:text-6xl md:text-7xl lg:text-8xl"
          >
            Excel&apos;den başlayan
            <br />
            <span className="text-gradient-neon">premium B2B vitrin.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="mx-auto mt-7 max-w-3xl text-lg font-light text-slate-400 md:text-2xl"
          >
            eKatalox ile ürün listenizi saniyeler içinde dijital kataloğa
            dönüştürün; bayi, toptancı ve distribütör ağınız tek bir lansman
            deneyiminde buluşsun.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row"
          >
            <a
              href="#waitlist"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-8 py-4 text-base font-medium text-[#0B0F19] shadow-[0_0_40px_rgba(255,255,255,0.15)] transition-all duration-300 hover:scale-[1.03] hover:shadow-[0_0_60px_rgba(0,210,255,0.4)]"
            >
              Erken Erişime Katıl
              <ArrowRight className="h-4 w-4" />
            </a>
            <a
              href="#demo"
              className="glass inline-flex items-center justify-center gap-2 rounded-full px-8 py-4 text-white transition-all duration-300 hover:bg-white/10"
            >
              Demosu İncele
              <ArrowRight className="h-4 w-4" />
            </a>
          </motion.div>
        </motion.div>

        <motion.div
          style={{
            scale: mockupScale,
            rotateX: mockupRotateX,
            y: mockupTranslateY,
            transformPerspective: 1200,
          }}
          className="z-10 mt-16 w-full max-w-6xl md:mt-20"
        >
          <HeroMockup />
        </motion.div>
      </div>
    </section>
  );
}

function HeroMockup() {
  return (
    <div className="overflow-hidden rounded-[28px] border border-white/10 bg-gradient-to-b from-slate-900/90 to-[#0B0F19] shadow-[0_30px_120px_-20px_rgba(0,210,255,0.35)]">
      <div className="flex items-center gap-2 border-b border-white/5 bg-black/20 px-5 py-3">
        <div className="flex gap-1.5">
          <div className="h-3 w-3 rounded-full bg-red-500/70" />
          <div className="h-3 w-3 rounded-full bg-yellow-500/70" />
          <div className="h-3 w-3 rounded-full bg-green-500/70" />
        </div>
        <div className="flex flex-1 justify-center">
          <div className="flex items-center gap-1.5 rounded-md bg-white/5 px-4 py-1 text-[11px] text-slate-400">
            <Globe className="h-3 w-3" />
            tenant.ekatalox.com
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between border-b border-white/5 px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#00D2FF] to-[#7928CA] text-sm font-bold text-white">
            E
          </div>
          <span className="text-sm font-semibold text-white">
            eKatalox B2B Vitrin
          </span>
        </div>
        <div className="hidden items-center gap-6 text-xs text-slate-400 md:flex">
          <span className="text-white">Koleksiyonlar</span>
          <span>Özel Fiyatlar</span>
          <span>Kampanyalar</span>
          <span>Destek</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="hidden w-40 truncate rounded-full bg-white/5 px-3 py-1.5 text-[11px] text-slate-400 sm:block md:w-56">
            Ürün ara…
          </div>
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/5 text-xs text-white">
            B2B
          </div>
        </div>
      </div>

      <div className="px-6 pt-5">
        <div className="relative aspect-[3/1] overflow-hidden rounded-xl border border-white/5 bg-gradient-to-br from-[#00D2FF]/20 via-slate-800 to-[#7928CA]/30">
          <div className="bg-grid absolute inset-0 opacity-30" />
          <div className="absolute inset-0 flex flex-col justify-center px-8">
            <span className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[#00D2FF]">
              B2B Katalog Lansmanı
            </span>
            <span className="mt-2 text-xl font-bold text-white md:text-3xl">
              Ürün listenizden premium satış deneyimine geçin
            </span>
          </div>
          <div className="absolute right-6 top-1/2 h-24 w-24 -translate-y-1/2 rounded-full bg-[#00D2FF]/40 blur-2xl md:h-32 md:w-32" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 p-6 md:grid-cols-4 md:gap-4">
        {[
          { name: "Wireless Hoparlör Pro", price: "₺1.249", stock: "Stokta" },
          { name: "GaN Şarj 65W", price: "₺389", stock: "Stokta" },
          { name: "USB-C Kablo 2m", price: "₺79", stock: "Stokta" },
          { name: "Powerbank 20.000", price: "₺549", stock: "Sınırlı" },
        ].map((product) => (
          <div
            key={product.name}
            className="rounded-xl border border-white/5 bg-white/[0.02] p-3 transition-colors hover:border-[#00D2FF]/30"
          >
            <div className="relative mb-3 aspect-square overflow-hidden rounded-lg bg-gradient-to-br from-slate-700/30 to-slate-900">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-white/5">
                  <Layers className="h-5 w-5 text-slate-500" />
                </div>
              </div>
              <div className="absolute right-2 top-2 rounded-md bg-[#00D2FF]/15 px-1.5 py-0.5 text-[9px] font-medium text-[#00D2FF]">
                {product.stock}
              </div>
            </div>
            <div className="truncate text-[11px] font-medium text-white">
              {product.name}
            </div>
            <div className="mt-1 flex items-center justify-between">
              <span className="text-xs font-semibold text-[#00D2FF]">
                {product.price}
              </span>
              <span className="text-[9px] text-slate-500">1. Liste</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ExcelSimulatorSection() {
  const [state, setState] = useState<SimulatorState>("idle");
  const [phaseIndex, setPhaseIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [dragOver, setDragOver] = useState(false);
  const [fileName, setFileName] = useState("");
  const [activeCategory, setActiveCategory] =
    useState<CategoryId>("hoparlor");
  const inputRef = useRef<HTMLInputElement | null>(null);

  const activeProducts = productMap[activeCategory];

  const startSimulation = (selectedName?: string) => {
    setFileName(selectedName || "ekatalox-urun-listesi.xlsx");
    setState("processing");
    setPhaseIndex(0);
    setProgress(0);

    const start = Date.now();
    const totalDuration = 2800;
    let frameId = 0;

    const tick = () => {
      const elapsed = Date.now() - start;
      const nextProgress = Math.min(100, (elapsed / totalDuration) * 100);
      setProgress(nextProgress);

      if (nextProgress < 34) {
        setPhaseIndex(0);
      } else if (nextProgress < 67) {
        setPhaseIndex(1);
      } else {
        setPhaseIndex(2);
      }

      if (elapsed < totalDuration) {
        frameId = requestAnimationFrame(tick);
      } else {
        setTimeout(() => setState("ready"), 200);
      }
    };

    frameId = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(frameId);
  };

  const resetSimulation = () => {
    setState("idle");
    setPhaseIndex(0);
    setProgress(0);
    setFileName("");
  };

  return (
    <section id="demo" className="relative px-6 py-32 md:py-40">
      <div className="absolute left-1/2 top-1/3 h-[700px] w-[700px] -translate-x-1/2 rounded-full bg-[#00D2FF]/10 blur-[160px]" />
      <div className="absolute bottom-0 right-1/4 h-[420px] w-[420px] rounded-full bg-[#7928CA]/15 blur-[140px]" />

      <div className="relative mx-auto max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.25 }}
          transition={{ duration: 0.8 }}
          className="mb-14 text-center"
        >
          <div className="glass mb-6 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs text-slate-300">
            <Zap className="h-3 w-3 text-[#00D2FF]" />
            Canlı Demo
          </div>
          <h2 className="display-headline text-balance text-4xl text-white md:text-6xl lg:text-7xl">
            Excel&apos;inizi bırakın,
            <br />
            <span className="text-gradient-neon">sonucu görün.</span>
          </h2>
          <p className="mx-auto mt-6 max-w-2xl text-lg font-light text-slate-400 md:text-xl">
            Demo tamamen statik verilerle çalışır. Amaç, gerçek ürün akışını
            canlı hissettiren bir lansman deneyimi sunmak.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.98 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          className="overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-white/[0.04] to-transparent shadow-[0_30px_120px_-30px_rgba(0,210,255,0.3)]"
        >
          <div className="flex items-center justify-between border-b border-white/5 bg-black/30 px-5 py-3">
            <div className="flex items-center gap-2">
              <div className="flex gap-1.5">
                <div className="h-3 w-3 rounded-full bg-red-500/70" />
                <div className="h-3 w-3 rounded-full bg-yellow-500/70" />
                <div className="h-3 w-3 rounded-full bg-green-500/70" />
              </div>
              <span className="ml-2 text-[11px] text-slate-500">
                eKatalox Studio
              </span>
            </div>

            {state === "ready" ? (
              <button
                type="button"
                onClick={resetSimulation}
                className="inline-flex items-center gap-1.5 rounded-full bg-white/5 px-3 py-1 text-[11px] text-slate-300 transition-colors hover:bg-white/10"
              >
                <RefreshCw className="h-3 w-3" />
                Tekrar Dene
              </button>
            ) : null}
          </div>

          <div className="relative min-h-[540px]">
            <AnimatePresence mode="wait">
              {state === "idle" ? (
                <motion.div
                  key="idle"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex min-h-[540px] flex-col items-center justify-center p-6 md:p-10"
                >
                  <div
                    onDragOver={(event) => {
                      event.preventDefault();
                      setDragOver(true);
                    }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={(event) => {
                      event.preventDefault();
                      setDragOver(false);
                      const droppedFile = event.dataTransfer.files?.[0];
                      startSimulation(droppedFile?.name);
                    }}
                    onClick={() => inputRef.current?.click()}
                    className={`relative flex aspect-[2/1] w-full max-w-3xl cursor-pointer flex-col items-center justify-center rounded-3xl border-2 border-dashed px-6 text-center transition-all duration-300 ${
                      dragOver
                        ? "border-[#00D2FF] bg-[#00D2FF]/5 scale-[1.01]"
                        : "border-white/15 bg-white/[0.02] hover:border-white/30 hover:bg-white/[0.04]"
                    }`}
                  >
                    <input
                      ref={inputRef}
                      type="file"
                      className="hidden"
                      onChange={(event) =>
                        startSimulation(event.target.files?.[0]?.name)
                      }
                    />
                    {dragOver ? (
                      <div className="shimmer pointer-events-none absolute inset-0 rounded-3xl" />
                    ) : null}
                    <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-gradient-to-br from-[#00D2FF]/20 to-[#7928CA]/20">
                      <FileUp
                        className={`h-7 w-7 ${
                          dragOver ? "text-[#00D2FF]" : "text-slate-300"
                        }`}
                      />
                    </div>
                    <h3 className="text-xl font-semibold text-white md:text-2xl">
                      {dragOver
                        ? "Dosyayı bırakın, vitrin hazırlansın"
                        : "Excel dosyanızı sürükleyin"}
                    </h3>
                    <p className="mt-2 max-w-md text-sm text-slate-400">
                      .xlsx, .xls veya .csv dosyası seçin; ürün vitrin deneyimi
                      saniyeler içinde simüle edilsin.
                    </p>
                    <div className="mt-5 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-medium text-black">
                      <Upload className="h-3.5 w-3.5" />
                      Dosya Seç
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => startSimulation("ornek-katalog.xlsx")}
                    className="mt-6 text-sm text-slate-400 transition-colors hover:text-[#00D2FF]"
                  >
                    Örnek dosyayla demoyu başlat
                  </button>
                </motion.div>
              ) : null}

              {state === "processing" ? (
                <motion.div
                  key="processing"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="relative flex min-h-[540px] flex-col items-center justify-center overflow-hidden p-6 md:p-10"
                >
                  <div className="glass mb-8 inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs text-slate-300">
                    <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-400" />
                    {fileName}
                  </div>

                  <div className="relative mb-8 h-40 w-40">
                    <motion.div
                      className="absolute inset-0 rounded-full border-2 border-[#00D2FF]/30"
                      animate={{ rotate: 360 }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "linear",
                      }}
                    />
                    <motion.div
                      className="absolute inset-3 rounded-full border-2 border-dashed border-[#7928CA]/40"
                      animate={{ rotate: -360 }}
                      transition={{
                        duration: 3,
                        repeat: Infinity,
                        ease: "linear",
                      }}
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <motion.div
                        animate={{ scale: [1, 1.1, 1] }}
                        transition={{ duration: 1.6, repeat: Infinity }}
                        className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-[#00D2FF] to-[#7928CA] shadow-[0_0_60px_rgba(0,210,255,0.5)]"
                      >
                        <Sparkles className="h-8 w-8 text-white" />
                      </motion.div>
                    </div>
                  </div>

                  <div className="relative mb-6 h-14 w-full max-w-md text-center">
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={phaseIndex}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.3 }}
                      >
                        <div className="text-lg font-semibold text-white md:text-xl">
                          {simulatorPhases[phaseIndex].label}
                        </div>
                        <div className="mt-1 text-xs text-slate-400 md:text-sm">
                          {simulatorPhases[phaseIndex].subLabel}
                        </div>
                      </motion.div>
                    </AnimatePresence>
                  </div>

                  <div className="w-full max-w-md">
                    <div className="relative h-1.5 overflow-hidden rounded-full bg-white/5">
                      <motion.div
                        className="h-full bg-gradient-to-r from-[#00D2FF] to-[#7928CA]"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500">
                      <span className="font-mono">{Math.round(progress)}%</span>
                      <div className="flex gap-1.5">
                        {simulatorPhases.map((phase, index) => (
                          <div
                            key={phase.label}
                            className={`h-1.5 w-1.5 rounded-full ${
                              index <= phaseIndex
                                ? "bg-[#00D2FF]"
                                : "bg-white/10"
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ) : null}

              {state === "ready" ? (
                <motion.div
                  key="ready"
                  initial={{ opacity: 0, scale: 0.97 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                  className="bg-[#0B0F19]"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-emerald-500/20 bg-emerald-500/10 px-5 py-2.5 text-xs text-emerald-300">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4" />
                      <span>
                        <span className="font-medium">{fileName}</span> işlendi ·
                        16 ürün · 4 kategori · 2.8 sn
                      </span>
                    </div>
                    <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-medium">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                      CANLI DEMO
                    </div>
                  </div>

                  <div className="flex flex-col items-center justify-between gap-3 border-b border-white/5 bg-gradient-to-r from-[#00D2FF]/[0.04] via-[#7928CA]/[0.06] to-[#00D2FF]/[0.04] px-5 py-5 sm:flex-row md:px-7">
                    <div className="text-center sm:text-left">
                      <div className="text-sm font-semibold text-white md:text-base">
                        Müşterilerinize hazır bir lansman deneyimi
                      </div>
                      <div className="mt-0.5 text-[11px] text-slate-400 md:text-xs">
                        Statik mock veri ile simüle edildi · 14 gün ücretsiz
                      </div>
                    </div>
                    <a
                      href="#waitlist"
                      className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-black shadow-[0_0_45px_rgba(0,210,255,0.45)] transition-transform hover:scale-[1.03]"
                    >
                      Bu Benim Vitrinim Olsun
                      <ArrowRight className="h-4 w-4" />
                    </a>
                  </div>

                  <div className="flex items-center justify-between border-b border-white/5 px-5 py-4 md:px-7">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#00D2FF] to-[#7928CA] text-sm font-bold text-white">
                        M
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-white">
                          Müşteri Toptan A.Ş.
                        </div>
                        <div className="text-[10px] text-slate-500">
                          musteri.ekatalox.com
                        </div>
                      </div>
                    </div>

                    <div className="hidden max-w-md flex-1 items-center justify-center md:flex">
                      <div className="flex w-full items-center gap-2 rounded-full border border-white/5 bg-white/5 px-3 py-1.5">
                        <Search className="h-3.5 w-3.5 text-slate-500" />
                        <span className="text-xs text-slate-500">
                          Ürün, marka veya kod ara…
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="hidden items-center gap-1.5 rounded-full bg-white/5 px-3 py-1.5 text-[11px] text-white sm:inline-flex">
                        <ShoppingCart className="h-3 w-3" />
                        0
                      </div>
                      <div className="rounded-full bg-gradient-to-r from-[#00D2FF] to-[#7928CA] px-3 py-1.5 text-[11px] font-medium text-white">
                        B2B Giriş
                      </div>
                    </div>
                  </div>

                  <div className="px-5 pt-5 md:px-7">
                    <div className="relative aspect-[3/1] overflow-hidden rounded-xl border border-white/5 bg-gradient-to-br from-[#00D2FF]/20 via-slate-800 to-[#7928CA]/30">
                      <div className="bg-grid absolute inset-0 opacity-30" />
                      <div className="absolute inset-0 flex flex-col justify-center px-6 md:px-10">
                        <span className="text-[10px] font-semibold uppercase tracking-widest text-[#00D2FF]">
                          Bayilere Özel
                        </span>
                        <span className="mt-1 text-lg font-bold text-white md:text-3xl">
                          Sezon açılışı · %25 avantajlı fiyatlar
                        </span>
                        <span className="mt-1 text-[11px] text-slate-300 md:text-xs">
                          Excel listenizden otomatik simüle edildi
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="px-5 py-4 md:px-7">
                    <LayoutGroup id="demo-tabs">
                      <div className="flex flex-wrap gap-2 overflow-x-auto">
                        {categoryTabs.map((tab) => (
                          <button
                            key={tab.id}
                            type="button"
                            onClick={() => setActiveCategory(tab.id)}
                            className="relative rounded-full px-3.5 py-1.5 text-xs transition-colors"
                          >
                            {activeCategory === tab.id ? (
                              <motion.span
                                layoutId="active-demo-tab"
                                className="absolute inset-0 rounded-full bg-white"
                                transition={{
                                  type: "spring",
                                  stiffness: 380,
                                  damping: 30,
                                }}
                              />
                            ) : null}
                            <span
                              className={`relative inline-flex items-center gap-1.5 ${
                                activeCategory === tab.id
                                  ? "font-medium text-black"
                                  : "text-slate-300"
                              }`}
                            >
                              {tab.label}
                              <span
                                className={`rounded-full px-1.5 py-0.5 text-[9px] ${
                                  activeCategory === tab.id
                                    ? "bg-black/10 text-black/60"
                                    : "bg-white/5 text-slate-500"
                                }`}
                              >
                                {tab.count}
                              </span>
                            </span>
                          </button>
                        ))}
                      </div>
                    </LayoutGroup>
                  </div>

                  <div className="grid min-h-[280px] grid-cols-2 gap-3 px-5 pb-7 md:grid-cols-4 md:gap-4 md:px-7">
                    <AnimatePresence mode="wait" initial={false}>
                      <motion.div
                        key={activeCategory}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                        className="col-span-2 grid grid-cols-2 gap-3 md:col-span-4 md:grid-cols-4 md:gap-4"
                      >
                        {activeProducts.map((product, index) => (
                          <motion.div
                            key={product.id}
                            initial={{ opacity: 0, y: 10, scale: 0.94 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            transition={{ duration: 0.3, delay: index * 0.05 }}
                            className="rounded-2xl border border-white/10 bg-white/[0.02] p-3 transition-colors hover:border-[#00D2FF]/30 md:p-4"
                          >
                            <div className="relative mb-3 aspect-square overflow-hidden rounded-xl bg-gradient-to-br from-slate-700/30 to-slate-900">
                              <div className="absolute inset-0 flex items-center justify-center">
                                <Layers className="h-7 w-7 text-slate-600" />
                              </div>
                              <div className="absolute right-2 top-2 rounded-md bg-emerald-500/15 px-1.5 py-0.5 text-[9px] text-emerald-300">
                                Stok {product.stock}
                              </div>
                            </div>
                            <div className="truncate text-xs font-medium text-white md:text-sm">
                              {product.name}
                            </div>
                            <div className="mt-1 flex items-center justify-between">
                              <span className="text-xs font-semibold text-[#00D2FF] md:text-sm">
                                {product.price}
                              </span>
                              <span className="text-[9px] text-slate-500">
                                1. Liste
                              </span>
                            </div>
                          </motion.div>
                        ))}
                      </motion.div>
                    </AnimatePresence>
                  </div>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function FeatureGridSection() {
  const [items, setItems] = useState([
    { id: "1", name: "Wireless Hoparlör Pro", price: "₺1.249" },
    { id: "2", name: "GaN Şarj 65W", price: "₺389" },
    { id: "3", name: "USB-C Kablo 2m", price: "₺79" },
    { id: "4", name: "Powerbank 20.000", price: "₺549" },
  ]);
  const [currency, setCurrency] = useState<"TRY" | "USD">("TRY");

  const tierPrices = {
    TRY: [
      { label: "1. Liste (Bayi)", value: "₺459,90" },
      { label: "2. Liste (Toptancı)", value: "₺419,00" },
      { label: "3. Liste (Anlaşmalı)", value: "₺379,50" },
    ],
    USD: [
      { label: "1. Liste (Bayi)", value: "$14.90" },
      { label: "2. Liste (Toptancı)", value: "$13.50" },
      { label: "3. Liste (Anlaşmalı)", value: "$12.20" },
    ],
  };

  const moveItem = (fromIndex: number, toIndex: number) => {
    setItems((current) => {
      const copy = [...current];
      const [removed] = copy.splice(fromIndex, 1);
      copy.splice(toIndex, 0, removed);
      return copy;
    });
  };

  return (
    <section className="relative px-6 py-32 md:py-40">
      <div className="absolute right-0 top-1/4 h-[500px] w-[500px] rounded-full bg-[#7928CA]/15 blur-[150px]" />

      <div className="relative mx-auto max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.25 }}
          transition={{ duration: 0.8 }}
          className="mb-16 text-center"
        >
          <div className="glass mb-6 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs text-slate-300">
            <ShieldCheck className="h-3 w-3 text-[#00D2FF]" />
            Bozulmadan entegre edilen deneyim
          </div>
          <h2 className="display-headline text-balance text-4xl text-white md:text-6xl lg:text-7xl">
            Tema sabit kalır,
            <br />
            <span className="text-gradient-neon">landing deneyimi parlar.</span>
          </h2>
          <p className="mx-auto mt-6 max-w-2xl text-lg font-light text-slate-400 md:text-xl">
            Mevcut projeyi bozmadan; sıralama, fiyat katmanı, banner düzeni ve
            performans hissi landing içinde izole şekilde korunur.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-6">
          <FeatureCard className="md:col-span-4">
            <div className="flex h-full flex-col">
              <div className="inline-flex w-fit items-center gap-2 rounded-full bg-[#00D2FF]/10 px-2.5 py-1 text-[10px] font-medium uppercase tracking-wider text-[#00D2FF]">
                <Move className="h-3 w-3" />
                Yönetim Hissi
              </div>
              <h3 className="mt-4 text-2xl font-semibold text-white md:text-3xl">
                Sürükle-bırak ürün sıralama
              </h3>
              <p className="mt-2 max-w-md text-sm text-slate-400 md:text-base">
                Ürünlerin vitrin içindeki görünüm önceliği hissini demo olarak
                canlı tutar.
              </p>

              <LayoutGroup>
                <div className="mt-6 flex flex-1 flex-col gap-2">
                  {items.map((item, index) => (
                    <motion.div
                      key={item.id}
                      layout
                      transition={{
                        type: "spring",
                        stiffness: 380,
                        damping: 30,
                      }}
                      className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-3"
                    >
                      <div className="flex flex-col gap-1">
                        <div className="flex gap-0.5">
                          <div className="h-1 w-1 rounded-full bg-slate-500" />
                          <div className="h-1 w-1 rounded-full bg-slate-500" />
                        </div>
                        <div className="flex gap-0.5">
                          <div className="h-1 w-1 rounded-full bg-slate-500" />
                          <div className="h-1 w-1 rounded-full bg-slate-500" />
                        </div>
                        <div className="flex gap-0.5">
                          <div className="h-1 w-1 rounded-full bg-slate-500" />
                          <div className="h-1 w-1 rounded-full bg-slate-500" />
                        </div>
                      </div>
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-slate-700/40 to-slate-900">
                        <Layers className="h-4 w-4 text-slate-500" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm text-white">
                          {item.name}
                        </div>
                        <div className="text-xs text-[#00D2FF]">
                          {item.price}
                        </div>
                      </div>
                      <div className="flex flex-col gap-1">
                        <button
                          type="button"
                          onClick={() =>
                            index > 0 ? moveItem(index, index - 1) : undefined
                          }
                          className="h-6 w-6 rounded-md bg-white/5 text-xs text-slate-400 hover:bg-white/10"
                        >
                          ↑
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            index < items.length - 1
                              ? moveItem(index, index + 1)
                              : undefined
                          }
                          className="h-6 w-6 rounded-md bg-white/5 text-xs text-slate-400 hover:bg-white/10"
                        >
                          ↓
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </LayoutGroup>
            </div>
          </FeatureCard>

          <FeatureCard className="md:col-span-2">
            <div className="flex h-full flex-col">
              <div className="inline-flex w-fit items-center gap-2 rounded-full bg-[#7928CA]/15 px-2.5 py-1 text-[10px] font-medium uppercase tracking-wider text-[#c084fc]">
                <DollarSign className="h-3 w-3" />
                Fiyat Katmanı
              </div>
              <h3 className="mt-4 text-2xl font-semibold text-white md:text-3xl">
                Çoklu fiyat görünümü
              </h3>
              <p className="mt-2 text-sm text-slate-400">
                Bayi, toptancı ve anlaşmalı müşteri seviyeleri tek bir akışta
                gösterilir.
              </p>

              <div className="glass mt-5 inline-flex w-fit rounded-full p-1">
                {(["TRY", "USD"] as const).map((code) => (
                  <button
                    key={code}
                    type="button"
                    onClick={() => setCurrency(code)}
                    className={`rounded-full px-3 py-1 text-xs transition-all ${
                      currency === code
                        ? "bg-white text-black"
                        : "text-slate-400"
                    }`}
                  >
                    {code}
                  </button>
                ))}
              </div>

              <div className="mt-5 space-y-2">
                <AnimatePresence mode="popLayout" initial={false}>
                  {tierPrices[currency].map((tier, index) => (
                    <motion.div
                      key={`${currency}-${tier.label}`}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ delay: index * 0.08 }}
                      className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.02] p-3"
                    >
                      <span className="text-xs text-slate-400">
                        {tier.label}
                      </span>
                      <span className="text-sm font-semibold text-white">
                        {tier.value}
                      </span>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          </FeatureCard>

          <FeatureCard className="md:col-span-3">
            <div className="flex h-full flex-col">
              <div className="inline-flex w-fit items-center gap-2 rounded-full bg-emerald-500/10 px-2.5 py-1 text-[10px] font-medium uppercase tracking-wider text-emerald-400">
                <ImageIcon className="h-3 w-3" />
                Stabil Tasarım
              </div>
              <h3 className="mt-4 text-2xl font-semibold text-white md:text-3xl">
                3:1 banner düzeni bozulmaz
              </h3>
              <p className="mt-2 max-w-md text-sm text-slate-400">
                Landing içindeki özel banner oranı ve vitrin alanları global
                stile çarpmadan kendi kapsayıcısında korunur.
              </p>

              <div className="mt-6 flex flex-1 flex-col justify-center gap-3">
                <div className="relative">
                  <div className="absolute -top-2 left-3 z-10 rounded-md border border-white/10 bg-[#0B0F19] px-2 py-0.5 text-[9px] text-slate-400">
                    1200 × 400
                  </div>
                  <div className="bg-grid aspect-[3/1] rounded-xl border border-[#00D2FF]/30 bg-gradient-to-br from-[#00D2FF]/15 to-[#7928CA]/15" />
                </div>
                <div className="grid grid-cols-3 gap-2 text-center text-[10px] text-slate-400">
                  <div className="rounded-md border border-white/5 bg-white/[0.03] py-1.5">
                    Akıllı Crop
                  </div>
                  <div className="rounded-md border border-white/5 bg-white/[0.03] py-1.5">
                    Sabit Grid
                  </div>
                  <div className="rounded-md border border-white/5 bg-white/[0.03] py-1.5">
                    Temaya Çarpmaz
                  </div>
                </div>
              </div>
            </div>
          </FeatureCard>

          <FeatureCard className="md:col-span-3">
            <div className="flex h-full flex-col justify-between">
              <div>
                <div className="inline-flex w-fit items-center gap-2 rounded-full bg-amber-500/10 px-2.5 py-1 text-[10px] font-medium uppercase tracking-wider text-amber-400">
                  <BarChart3 className="h-3 w-3" />
                  Performans Hissi
                </div>
                <h3 className="mt-4 text-2xl font-semibold text-white md:text-3xl">
                  Hızlı, premium ve odaklı
                </h3>
                <p className="mt-2 text-sm text-slate-400">
                  Ana sayfa; kampanya, vitrin ve fiyat kararını tek oturumda
                  netleştirecek şekilde tasarlanır.
                </p>
              </div>

              <div className="mt-6 grid grid-cols-3 gap-3">
                {[
                  { value: "5 sn", label: "Demo Etkisi" },
                  { value: "3 Kat", label: "Fiyat Katmanı" },
                  { value: "∞", label: "Mock Senaryo" },
                ].map((stat) => (
                  <div
                    key={stat.label}
                    className="rounded-xl border border-white/10 bg-white/[0.02] p-4 text-center"
                  >
                    <div className="text-gradient-neon text-2xl font-bold md:text-3xl">
                      {stat.value}
                    </div>
                    <div className="mt-1 text-[10px] uppercase tracking-wider text-slate-500">
                      {stat.label}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </FeatureCard>
        </div>
      </div>
    </section>
  );
}

function FeatureCard({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      className={`group relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-white/[0.04] to-white/[0.01] p-7 transition-all duration-500 hover:border-white/20 md:p-8 ${className ?? ""}`}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-[#00D2FF]/[0.04] to-[#7928CA]/[0.04] opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
      <div className="relative h-full">{children}</div>
    </motion.div>
  );
}

function ComparisonSection() {
  return (
    <section id="karsilastirma" className="relative px-6 py-32 md:py-40">
      <div className="absolute left-0 top-1/3 h-[480px] w-[480px] rounded-full bg-[#00D2FF]/10 blur-[160px]" />
      <div className="absolute bottom-1/4 right-0 h-[480px] w-[480px] rounded-full bg-[#7928CA]/15 blur-[160px]" />

      <div className="relative mx-auto max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.25 }}
          transition={{ duration: 0.8 }}
          className="mb-14 text-center"
        >
          <div className="glass mb-6 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs text-slate-300">
            <Sparkles className="h-3 w-3 text-[#00D2FF]" />
            B2B Karşılaştırma
          </div>
          <h2 className="display-headline text-balance text-4xl text-white md:text-6xl lg:text-7xl">
            Neden geçici sayfa değil,
            <br />
            <span className="text-gradient-neon">bu lansman deneyimi?</span>
          </h2>
        </motion.div>

        <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03]">
          <div className="grid grid-cols-4 border-b border-white/10 bg-white/[0.02]">
            <div className="px-4 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500 md:px-6">
              Kriter
            </div>
            <ComparisonHeader label="eKatalox" highlighted />
            <ComparisonHeader label="Klasik Paket" />
            <ComparisonHeader label="Manuel Katalog" />
          </div>

          {comparisonRows.map((row) => (
            <div
              key={row.label}
              className="grid grid-cols-4 border-b border-white/5 last:border-b-0"
            >
              <div className="px-4 py-4 text-sm text-white md:px-6">
                {row.label}
              </div>
              <ComparisonCell value={row.ekatalox} highlighted />
              <ComparisonCell value={row.classic} />
              <ComparisonCell value={row.manual} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ComparisonHeader({
  label,
  highlighted = false,
}: {
  label: string;
  highlighted?: boolean;
}) {
  return (
    <div
      className={`px-4 py-4 text-center text-xs font-semibold uppercase tracking-wider md:px-6 ${
        highlighted ? "text-[#00D2FF]" : "text-slate-400"
      }`}
    >
      {label}
    </div>
  );
}

function ComparisonCell({
  value,
  highlighted = false,
}: {
  value: string;
  highlighted?: boolean;
}) {
  return (
    <div
      className={`px-4 py-4 text-center text-sm md:px-6 ${
        highlighted ? "font-medium text-white" : "text-slate-400"
      }`}
    >
      {value}
    </div>
  );
}

function PricingSection() {
  return (
    <section id="fiyatlandirma" className="relative px-6 py-32 md:py-40">
      <div className="absolute right-1/4 top-1/4 h-[500px] w-[500px] rounded-full bg-[#7928CA]/15 blur-[160px]" />
      <div className="absolute bottom-0 left-1/4 h-[500px] w-[500px] rounded-full bg-[#00D2FF]/10 blur-[160px]" />

      <div className="relative mx-auto max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.25 }}
          transition={{ duration: 0.8 }}
          className="mb-16 text-center"
        >
          <div className="glass mb-6 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs text-slate-300">
            <DollarSign className="h-3 w-3 text-[#00D2FF]" />
            Fiyatlandırma
          </div>
          <h2 className="display-headline text-balance text-4xl text-white md:text-6xl lg:text-7xl">
            Şeffaf planlar,
            <br />
            <span className="text-gradient-neon">kırık akış yok.</span>
          </h2>
          <p className="mx-auto mt-6 max-w-2xl text-lg font-light text-slate-400 md:text-xl">
            Tüm CTA&apos;lar çalışır, kullanıcı aynı sayfada karar verir ve
            doğrudan waitlist alanına yönlenir.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3 lg:gap-6">
          {pricingPlans.map((plan, index) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{
                duration: 0.7,
                delay: index * 0.1,
                ease: [0.16, 1, 0.3, 1],
              }}
              className={`relative overflow-hidden rounded-3xl p-px ${
                plan.featured ? "lg:-mt-4 lg:mb-4" : ""
              }`}
            >
              {plan.featured ? (
                <>
                  <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-[#00D2FF] via-[#7928CA] to-[#00D2FF]" />
                  <div className="absolute -inset-1 rounded-3xl bg-gradient-to-br from-[#00D2FF]/40 to-[#7928CA]/40 blur-2xl" />
                </>
              ) : (
                <div className="absolute inset-0 rounded-3xl border border-white/10" />
              )}

              <div className="relative flex h-full flex-col rounded-3xl bg-[#0B0F19] p-7 md:p-8">
                <div className="mb-5 flex items-center justify-between">
                  <span
                    className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-medium uppercase tracking-wider ${
                      plan.featured
                        ? "bg-gradient-to-r from-[#00D2FF] to-[#7928CA] text-white"
                        : "bg-white/5 text-slate-400"
                    }`}
                  >
                    {plan.tag}
                  </span>
                  {plan.featured ? (
                    <span className="text-[10px] font-semibold uppercase tracking-widest text-[#00D2FF]">
                      Önerilen
                    </span>
                  ) : null}
                </div>

                <h3 className="text-2xl font-semibold text-white md:text-3xl">
                  {plan.name}
                </h3>
                <p className="mt-2 min-h-[42px] text-sm text-slate-400">
                  {plan.description}
                </p>

                <div className="mt-6 flex items-baseline gap-2">
                  <span
                    className={`text-4xl font-bold tracking-tight md:text-5xl ${
                      plan.featured ? "text-gradient-neon" : "text-white"
                    }`}
                  >
                    {plan.price}
                  </span>
                  <span className="text-sm text-slate-500">{plan.unit}</span>
                </div>

                <div className="my-7 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

                <ul className="flex-1 space-y-3">
                  {plan.items.map((item) => (
                    <li
                      key={item}
                      className="flex items-start gap-2.5 text-sm text-slate-300"
                    >
                      <div
                        className={`mt-0.5 flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full ${
                          plan.featured ? "bg-[#00D2FF]/20" : "bg-white/5"
                        }`}
                      >
                        <Check
                          className={`h-2.5 w-2.5 ${
                            plan.featured
                              ? "text-[#00D2FF]"
                              : "text-emerald-400"
                          }`}
                          strokeWidth={3}
                        />
                      </div>
                      {item}
                    </li>
                  ))}
                </ul>

                <a
                  href="#waitlist"
                  className={`mt-8 inline-flex items-center justify-center gap-2 rounded-full px-6 py-3.5 text-sm font-medium transition-all duration-300 ${
                    plan.featured
                      ? "bg-white text-black shadow-[0_0_40px_rgba(0,210,255,0.3)] hover:scale-[1.02]"
                      : "glass text-white hover:bg-white/10"
                  }`}
                >
                  Waitlist&apos;e Katıl
                  <ArrowRight className="h-4 w-4" />
                </a>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="mt-10 text-center text-sm text-slate-500">
          Tüm planlar aynı landing deneyimi üzerinde karar vermeyi kolaylaştırır.
        </div>
      </div>
    </section>
  );
}

function FaqSection() {
  const [openQuestion, setOpenQuestion] = useState<string | null>(
    faqItems[0]?.question ?? null,
  );

  return (
    <section id="faq" className="relative px-6 py-32 md:py-36">
      <div className="relative mx-auto max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.25 }}
          transition={{ duration: 0.8 }}
          className="mb-14 text-center"
        >
          <div className="glass mb-6 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs text-slate-300">
            <ShieldCheck className="h-3 w-3 text-[#00D2FF]" />
            Sıkça Sorulanlar
          </div>
          <h2 className="display-headline text-balance text-4xl text-white md:text-6xl">
            Sorular net,
            <br />
            <span className="text-gradient-neon">akış tek sayfada.</span>
          </h2>
        </motion.div>

        <div className="space-y-3">
          {faqItems.map((item, index) => {
            const isOpen = openQuestion === item.question;

            return (
              <motion.div
                key={item.question}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ delay: index * 0.05, duration: 0.45 }}
                className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02]"
              >
                <button
                  type="button"
                  onClick={() =>
                    setOpenQuestion(isOpen ? null : item.question)
                  }
                  className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
                >
                  <span className="text-sm font-medium text-white md:text-base">
                    {item.question}
                  </span>
                  <span className="text-slate-500">{isOpen ? "−" : "+"}</span>
                </button>

                <AnimatePresence initial={false}>
                  {isOpen ? (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25 }}
                      className="overflow-hidden"
                    >
                      <div className="border-t border-white/5 px-5 py-4 text-sm leading-7 text-slate-400">
                        {item.answer}
                      </div>
                    </motion.div>
                  ) : null}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function WaitlistSection() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const queueNumber = "#2481";

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

    if (!isValid) {
      setError("Lütfen geçerli bir e-posta adresi girin.");
      return;
    }

    setSubmitted(true);
  };

  return (
    <section id="waitlist" className="relative px-6 py-28 md:py-36">
      <div className="absolute left-1/2 top-1/2 h-[760px] w-[760px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#00D2FF]/10 blur-[160px]" />

      <div className="relative mx-auto max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.25 }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-white/[0.04] to-transparent p-8 text-center md:p-14"
        >
          <div className="absolute -top-20 left-1/2 h-[300px] w-[600px] -translate-x-1/2 rounded-full bg-[#7928CA]/20 blur-[120px]" />

          <div className="relative">
            <div className="glass mb-6 inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-[11px] text-slate-300">
              <span className="h-1.5 w-1.5 rounded-full bg-[#00D2FF]" />
              Erken Erişim · Sınırlı Kontenjan
            </div>

            <h2 className="display-headline text-balance text-3xl text-white md:text-5xl lg:text-6xl">
              Şimdi katılın,
              <br />
              <span className="text-gradient-neon">ilk sıradakilerden olun.</span>
            </h2>
            <p className="mx-auto mt-5 max-w-xl text-base font-light text-slate-400 md:text-lg">
              Waitlist akışı front-end üzerinde simüle edilir; sayfa yenilenmez,
              hata vermez ve başarı animasyonu doğrudan burada görünür.
            </p>

            <div className="mx-auto mt-10 max-w-md">
              <AnimatePresence mode="wait">
                {!submitted ? (
                  <motion.form
                    key="form"
                    onSubmit={submit}
                    noValidate
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.35 }}
                  >
                    <div
                      className={`flex items-center gap-2 rounded-full border bg-black/30 p-1.5 backdrop-blur-xl transition-colors ${
                        error
                          ? "border-red-500/60"
                          : "border-white/10 focus-within:border-[#00D2FF]/60"
                      }`}
                    >
                      <input
                        type="email"
                        placeholder="kurumsal@firmaniz.com"
                        value={email}
                        onChange={(event) => {
                          setEmail(event.target.value);
                          setError("");
                        }}
                        className="flex-1 bg-transparent px-4 py-2.5 text-sm text-white placeholder:text-slate-500 outline-none"
                      />
                      <button
                        type="submit"
                        className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-white px-5 py-2.5 text-sm font-medium text-black transition-transform hover:scale-[1.03]"
                      >
                        Sıraya Katıl
                        <ArrowRight className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    {error ? (
                      <motion.div
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-3 text-xs text-red-400"
                      >
                        {error}
                      </motion.div>
                    ) : null}

                    <div className="mt-4 flex items-center justify-center gap-5 text-[11px] text-slate-500">
                      <div className="flex items-center gap-1.5">
                        <ShieldCheck className="h-3 w-3" />
                        Spam yok
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Zap className="h-3 w-3" />
                        Anında onay
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Check className="h-3 w-3" />
                        Tek ekranda tamam
                      </div>
                    </div>
                  </motion.form>
                ) : (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, scale: 0.9, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                  >
                    <motion.div
                      initial={{ scale: 0, rotate: -45 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{
                        delay: 0.15,
                        type: "spring",
                        stiffness: 220,
                        damping: 14,
                      }}
                      className="relative mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-emerald-400 shadow-[0_0_60px_rgba(16,185,129,0.5)]"
                    >
                      <CheckCircle2
                        className="h-10 w-10 text-white"
                        strokeWidth={2.5}
                      />
                      <motion.div
                        className="absolute inset-0 rounded-full border-2 border-emerald-300"
                        initial={{ scale: 1, opacity: 0.8 }}
                        animate={{ scale: 1.8, opacity: 0 }}
                        transition={{ duration: 1.2, repeat: Infinity }}
                      />
                    </motion.div>

                    <motion.h3
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.35 }}
                      className="mt-6 text-xl font-semibold text-white md:text-2xl"
                    >
                      Harika! Kaydınız alındı.
                    </motion.h3>

                    <motion.p
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.45 }}
                      className="mx-auto mt-2 max-w-md text-sm text-slate-400 md:text-base"
                    >
                      Yakında sizinle iletişime geçeceğiz.{" "}
                      <span className="font-medium text-white">{email}</span>{" "}
                      adresini gelen kutunuzdan takip edin.
                    </motion.p>

                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.55 }}
                      className="mt-6 inline-flex items-center gap-2 rounded-full border border-[#00D2FF]/40 bg-gradient-to-r from-[#00D2FF]/15 to-[#7928CA]/15 px-4 py-2 text-sm text-white shadow-[0_0_30px_rgba(0,210,255,0.25)]"
                    >
                      <Sparkles className="h-3.5 w-3.5 text-[#00D2FF]" />
                      Sıra Numaranız:{" "}
                      <span className="text-gradient-neon font-mono font-semibold">
                        {queueNumber}
                      </span>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function FinalCtaSection() {
  return (
    <section className="relative overflow-hidden px-6 py-36 md:py-48">
      <div className="absolute inset-0">
        <div className="absolute left-1/2 top-1/2 h-[900px] w-[900px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#7928CA]/20 blur-[160px]" />
        <div className="absolute left-1/4 top-1/3 h-[500px] w-[500px] rounded-full bg-[#00D2FF]/15 blur-[140px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.25 }}
        transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
        className="relative mx-auto max-w-5xl text-center"
      >
        <h2 className="display-headline text-balance text-5xl text-white sm:text-6xl md:text-7xl lg:text-8xl">
          Geçici ana sayfa yerine
          <br />
          <span className="text-gradient-neon">satışa yakın bir vitrin.</span>
        </h2>
        <p className="mx-auto mt-8 max-w-2xl text-lg font-light text-slate-400 md:text-2xl">
          Kullanıcıyı form, demo ve fiyat kararı arasında tek sayfada tutan bir
          lansman deneyimi.
        </p>

        <div className="mt-12 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <a
            href="#waitlist"
            className="inline-flex items-center gap-2 rounded-full bg-white px-10 py-5 text-base font-medium text-black shadow-[0_0_60px_rgba(0,210,255,0.3)] transition-all duration-300 hover:scale-[1.03] hover:shadow-[0_0_80px_rgba(0,210,255,0.5)]"
          >
            Erken Erişim Listesine Yazıl
            <ArrowRight className="h-4 w-4" />
          </a>
          <a
            href="#demo"
            className="text-sm text-slate-400 transition-colors hover:text-white"
          >
            veya canlı demo bölümüne geri dön →
          </a>
        </div>
      </motion.div>
    </section>
  );
}

function LandingFooter() {
  return (
    <footer className="relative border-t border-white/5 bg-[#0B0F19]">
      <div className="neon-line" />
      <div className="mx-auto max-w-7xl px-6 py-16 md:py-20">
        <div className="grid grid-cols-2 gap-10 md:grid-cols-5">
          <div className="col-span-2">
            <Link href="/#top" className="flex items-center gap-2">
              <EkataloxLogo className="h-10 w-[180px]" />
            </Link>
            <p className="mt-4 max-w-xs text-sm text-slate-400">
              Toptancılar ve distribütörler için Apple tarzı, simülatörlü ve
              karar odaklı yeni nesil B2B lansman sayfası.
            </p>
            <div className="mt-6 flex gap-3">
              <a
                href="#demo"
                className="glass rounded-full px-4 py-2 text-xs text-white transition-colors hover:bg-white/10"
              >
                Canlı Demo
              </a>
              <a
                href="#waitlist"
                className="rounded-full bg-white px-4 py-2 text-xs font-medium text-black transition-transform hover:scale-105"
              >
                Erken Erişim
              </a>
            </div>
          </div>

          <FooterColumn
            title="Ürün"
            items={[
              ["Demo", "#demo"],
              ["Karşılaştırma", "#karsilastirma"],
              ["Fiyatlandırma", "#fiyatlandirma"],
            ]}
          />
          <FooterColumn
            title="Karar"
            items={[
              ["Waitlist", "#waitlist"],
              ["SSS", "#faq"],
              ["Erken Erişim", "#waitlist"],
            ]}
          />
          <FooterColumn
            title="Akış"
            items={[
              ["Hero", "#top"],
              ["Demo", "#demo"],
              ["Final CTA", "#waitlist"],
            ]}
          />
        </div>

        <div className="mt-16 flex flex-col items-center justify-between gap-4 border-t border-white/5 pt-8 text-xs text-slate-500 md:flex-row">
          <div>© 2026 eKatalox. Tüm hakları saklıdır.</div>
          <div className="flex gap-6">
            <a href="#faq" className="hover:text-white">
              Gizlilik
            </a>
            <a href="#faq" className="hover:text-white">
              Kullanım Şartları
            </a>
            <a href="#faq" className="hover:text-white">
              KVKK
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({
  title,
  items,
}: {
  title: string;
  items: Array<[string, string]>;
}) {
  return (
    <div>
      <h4 className="text-xs font-semibold uppercase tracking-wider text-white">
        {title}
      </h4>
      <ul className="mt-4 space-y-3">
        {items.map(([label, href]) => (
          <li key={label}>
            <a
              href={href}
              className="text-sm text-slate-400 transition-colors hover:text-white"
            >
              {label}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}