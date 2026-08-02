'use client'

import { useRef, useState } from 'react'
import Link from 'next/link'
import { motion, useScroll, useTransform, AnimatePresence, LayoutGroup } from 'framer-motion'
import { EkataloxLogo } from '@/components/brand/ekatalox-logo'
import {
  ArrowRight, Upload, Sparkles, Store, Move, DollarSign, Image as ImageIcon,
  Check, ChevronRight, Zap, Globe, ShieldCheck, BarChart3, Layers, FileSpreadsheet,
  FileUp, Loader2, CheckCircle2, Download, RefreshCw, Search, ShoppingCart, HelpCircle, Plus,
  Rocket, TrendingUp, Building2, Crown, Users, Package, CircleCheck
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
      <div className="absolute inset-0 bg-[#0B0F19]" />
      <div className="absolute inset-0 bg-grid mask-radial-fade opacity-60" />
      <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[900px] h-[900px] rounded-full bg-[#00D2FF]/20 blur-[140px] animate-pulse-glow" />
      <div className="absolute top-40 right-0 w-[600px] h-[600px] rounded-full bg-[#7928CA]/25 blur-[120px]" />
      <div className="absolute top-60 left-0 w-[500px] h-[500px] rounded-full bg-[#00D2FF]/10 blur-[120px]" />

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
            <span className="w-1.5 h-1.5 rounded-full bg-[#00D2FF] animate-pulse" />
            Yeni Nesil B2B Vitrin Platformu
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, scale: 0.92, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
            className="display-headline text-5xl sm:text-6xl md:text-7xl lg:text-8xl text-white text-balance"
          >
            Toptan Ticaretin <br />
            <span className="text-gradient-neon">Dijital İşletim Sistemi.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="mt-7 text-lg md:text-2xl text-slate-400 max-w-3xl mx-auto font-light text-balance"
          >
            Excel operasyonlarını ve WhatsApp sipariş kargaşasını geride bırakın. Dijital kataloğunuz <span className="text-white font-medium">1 dakikada</span> yayında.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <a href="/kayit" className="group relative inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full bg-white text-[#0B0F19] font-medium text-base hover:scale-[1.03] transition-all duration-300 shadow-[0_0_40px_rgba(255,255,255,0.15)] hover:shadow-[0_0_60px_rgba(0,210,255,0.4)]">
              Hemen Ücretsiz Başla
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
            </a>
            <a href="#demo" className="group inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full glass text-white hover:bg-white/10 transition-all duration-300">
              Demosu İncele
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </a>
          </motion.div>
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
    <div className="relative rounded-2xl md:rounded-3xl border border-white/10 bg-gradient-to-b from-slate-900/90 to-[#0B0F19] shadow-[0_30px_120px_-20px_rgba(0,210,255,0.35)] overflow-hidden">
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
            tenant.ekatalox.com
          </div>
        </div>
      </div>

      {/* Storefront header */}
      <div className="px-6 py-4 flex items-center justify-between border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#00D2FF] to-[#7928CA] flex items-center justify-center text-white font-bold text-sm">L</div>
          <span className="text-white font-semibold text-sm">LucaTech Toptan</span>
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
        <div className="aspect-[3/1] rounded-xl overflow-hidden relative bg-gradient-to-br from-[#00D2FF]/20 via-slate-800 to-[#7928CA]/30 border border-white/5">
          <div className="absolute inset-0 bg-grid opacity-30" />
          <div className="absolute inset-0 flex flex-col justify-center px-8">
            <span className="text-[10px] text-[#00D2FF] uppercase tracking-widest font-semibold">Yaz Kampanyası</span>
            <span className="text-xl md:text-3xl font-bold text-white mt-1">Aksesuar Kategorisinde %30'a Varan İndirim</span>
          </div>
          <div className="absolute right-6 top-1/2 -translate-y-1/2 w-24 h-24 md:w-32 md:h-32 rounded-full bg-[#00D2FF]/40 blur-2xl" />
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
          <div key={i} className="rounded-xl border border-white/5 bg-white/[0.02] p-3 hover:border-[#00D2FF]/30 transition-colors">
            <div className="aspect-square rounded-lg bg-gradient-to-br from-slate-700/30 to-slate-900 mb-3 relative overflow-hidden">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-12 h-12 rounded-lg bg-white/5 flex items-center justify-center">
                  <Layers className="w-5 h-5 text-slate-500" />
                </div>
              </div>
              <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded-md bg-[#00D2FF]/15 text-[9px] text-[#00D2FF] font-medium">{p.stock}</div>
            </div>
            <div className="text-[11px] text-white font-medium truncate">{p.n}</div>
            <div className="flex items-center justify-between mt-1">
              <span className="text-xs text-[#00D2FF] font-semibold">{p.p}</span>
              <span className="text-[9px] text-slate-500">1. Fiyat</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ----------------------------- EXCEL SIMULATOR (FLAGSHIP) --------------------
const ExcelSimulator = () => {
  const [state, setState] = useState('idle') // idle | processing | result
  const [fileName, setFileName] = useState('')
  const [phase, setPhase] = useState(0)
  const [progress, setProgress] = useState(0)
  const [dragOver, setDragOver] = useState(false)
  const inputRef = useRef(null)

  const phases = [
    { label: 'Dosya okunuyor...', sub: 'Excel hücreleri analiz ediliyor' },
    { label: 'Para birimleri temizleniyor...', sub: 'USD, EUR ve ₺ standardize ediliyor' },
    { label: 'Kategoriler otomatik oluşturuluyor...', sub: 'Çok seviyeli hiyerarşi kuruluyor' },
  ]

  const startProcess = (name) => {
    setFileName(name || 'stok_listesi_haziran.xlsx')
    setState('processing')
    setPhase(0)
    setProgress(0)

    const totalMs = 3000
    const startTime = Date.now()
    let raf
    const tick = () => {
      const elapsed = Date.now() - startTime
      const p = Math.min(100, (elapsed / totalMs) * 100)
      setProgress(p)
      if (p < 33) setPhase(0)
      else if (p < 66) setPhase(1)
      else setPhase(2)
      if (elapsed < totalMs) {
        raf = requestAnimationFrame(tick)
      } else {
        setTimeout(() => setState('result'), 250)
      }
    }
    raf = requestAnimationFrame(tick)
  }

  const reset = () => {
    setState('idle')
    setPhase(0)
    setProgress(0)
    setFileName('')
  }

  const onDrop = (e) => {
    e.preventDefault()
    setDragOver(false)
    const f = e.dataTransfer.files?.[0]
    startProcess(f?.name)
  }
  const onSelect = (e) => {
    const f = e.target.files?.[0]
    if (f) startProcess(f.name)
  }

  return (
    <section id="simulator" className="relative py-32 md:py-44 px-6">
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[800px] h-[800px] rounded-full bg-[#00D2FF]/10 blur-[160px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] rounded-full bg-[#7928CA]/15 blur-[140px] pointer-events-none" />
      <div className="max-w-5xl mx-auto relative">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false, amount: 0.3 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-14"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass text-xs text-slate-300 mb-6">
            <Zap className="w-3 h-3 text-[#00D2FF]" />
            Canlı Simülasyon
          </div>
          <h2 className="display-headline text-4xl md:text-6xl lg:text-7xl text-white text-balance">
            Şimdi siz <span className="text-gradient-neon">deneyin.</span>
          </h2>
          <p className="mt-6 text-lg md:text-xl text-slate-400 max-w-2xl mx-auto font-light">
            Herhangi bir dosyayı sürükleyin. 3 saniye içinde vitrininizi izleyin.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.97 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: false, amount: 0.2 }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          className="relative rounded-3xl border border-white/10 bg-gradient-to-b from-white/[0.04] to-transparent overflow-hidden shadow-[0_30px_120px_-30px_rgba(0,210,255,0.3)]"
        >
          {/* Top chrome */}
          <div className="flex items-center justify-between px-5 py-3 border-b border-white/5 bg-black/30">
            <div className="flex items-center gap-2">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500/70" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/70" />
                <div className="w-3 h-3 rounded-full bg-green-500/70" />
              </div>
              <span className="ml-2 text-[11px] text-slate-500">eKatalox Studio</span>
            </div>
            {state === 'result' && (
              <button
                onClick={reset}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 hover:bg-white/10 text-[11px] text-slate-300 transition-colors"
              >
                <RefreshCw className="w-3 h-3" /> Tekrar Dene
              </button>
            )}
          </div>

          <div className="relative min-h-[520px] md:min-h-[560px]">
            <AnimatePresence mode="wait">
              {state === 'idle' && (
                <motion.div
                  key="idle"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.4 }}
                  className="absolute inset-0 p-6 md:p-10 flex flex-col items-center justify-center"
                >
                  <div
                    onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={onDrop}
                    onClick={() => inputRef.current?.click()}
                    className={`relative w-full max-w-2xl aspect-[2/1] rounded-2xl border-2 border-dashed transition-all duration-300 cursor-pointer flex flex-col items-center justify-center text-center px-6
                      ${dragOver
                        ? 'border-[#00D2FF] bg-[#00D2FF]/5 scale-[1.01]'
                        : 'border-white/15 bg-white/[0.02] hover:border-white/30 hover:bg-white/[0.04]'}`}
                  >
                    <input ref={inputRef} type="file" className="hidden" onChange={onSelect} />
                    {dragOver && <div className="absolute inset-0 rounded-2xl shimmer pointer-events-none" />}
                    <motion.div
                      animate={{ y: dragOver ? -6 : 0 }}
                      className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#00D2FF]/20 to-[#7928CA]/20 border border-white/10 flex items-center justify-center mb-5"
                    >
                      <FileUp className={`w-7 h-7 ${dragOver ? 'text-[#00D2FF]' : 'text-slate-300'}`} />
                    </motion.div>
                    <h3 className="text-xl md:text-2xl font-semibold text-white">
                      {dragOver ? 'Bırakın, sihir başlasın' : 'Excel dosyanızı buraya sürükleyin'}
                    </h3>
                    <p className="mt-2 text-sm text-slate-400 max-w-md">
                      .xlsx, .xls veya .csv — herhangi bir dosya yükleyin, biz gerisini halledelim.
                    </p>
                    <div className="mt-5 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white text-black text-xs font-medium">
                      <FileUp className="w-3.5 h-3.5" />
                      Dosya Seç
                    </div>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); startProcess('ornek_katalog.xlsx') }}
                    className="mt-6 inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-[#00D2FF] transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Örnek Excel Dosyasını İndir
                  </button>
                </motion.div>
              )}

              {state === 'processing' && (
                <motion.div
                  key="processing"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.4 }}
                  className="absolute inset-0 p-6 md:p-10 flex flex-col items-center justify-center"
                >
                  {/* File pill */}
                  <motion.div
                    initial={{ y: 10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass text-xs text-slate-300 mb-8"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                    {fileName}
                  </motion.div>

                  {/* Animated visual */}
                  <div className="relative w-40 h-40 mb-8">
                    <motion.div
                      className="absolute inset-0 rounded-full border-2 border-[#00D2FF]/30"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                    />
                    <motion.div
                      className="absolute inset-3 rounded-full border-2 border-[#7928CA]/40 border-dashed"
                      animate={{ rotate: -360 }}
                      transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <motion.div
                        animate={{ scale: [1, 1.1, 1] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                        className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#00D2FF] to-[#7928CA] flex items-center justify-center shadow-[0_0_60px_rgba(0,210,255,0.5)]"
                      >
                        <Sparkles className="w-8 h-8 text-white" />
                      </motion.div>
                    </div>
                  </div>

                  {/* Phase texts */}
                  <div className="h-14 mb-6 text-center relative w-full max-w-md">
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={phase}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.3 }}
                      >
                        <div className="text-lg md:text-xl font-semibold text-white">{phases[phase].label}</div>
                        <div className="text-xs md:text-sm text-slate-400 mt-1">{phases[phase].sub}</div>
                      </motion.div>
                    </AnimatePresence>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full max-w-md">
                    <div className="h-1.5 rounded-full bg-white/5 overflow-hidden relative">
                      <motion.div
                        className="h-full bg-gradient-to-r from-[#00D2FF] to-[#7928CA]"
                        style={{ width: `${progress}%` }}
                        transition={{ ease: 'linear' }}
                      />
                      <div
                        className="absolute top-0 h-full w-20 bg-gradient-to-r from-transparent via-white/40 to-transparent"
                        style={{ left: `${Math.max(0, progress - 10)}%`, transition: 'left 0.1s linear' }}
                      />
                    </div>
                    <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500">
                      <span className="font-mono">{Math.round(progress)}%</span>
                      <div className="flex gap-1.5">
                        {phases.map((_, i) => (
                          <div
                            key={i}
                            className={`w-1.5 h-1.5 rounded-full transition-colors ${i <= phase ? 'bg-[#00D2FF]' : 'bg-white/10'}`}
                          />
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Background scanning lines */}
                  <div className="absolute inset-0 pointer-events-none overflow-hidden">
                    {[0, 1, 2].map(i => (
                      <motion.div
                        key={i}
                        className="absolute h-px w-full bg-gradient-to-r from-transparent via-[#00D2FF]/40 to-transparent"
                        initial={{ top: '-10%' }}
                        animate={{ top: '110%' }}
                        transition={{ duration: 2.5, repeat: Infinity, delay: i * 0.8, ease: 'linear' }}
                      />
                    ))}
                  </div>
                </motion.div>
              )}

              {state === 'result' && (
                <motion.div
                  key="result"
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                  className="relative"
                >
                  <GeneratedStorefront fileName={fileName} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

const GeneratedStorefront = ({ fileName }) => {
  const [activeCat, setActiveCat] = useState('hoparlor')
  const cats = [
    { id: 'hoparlor', label: 'Hoparlör', count: 4 },
    { id: 'sarj', label: 'Şarj Cihazı', count: 4 },
    { id: 'kablo', label: 'Kablo & Aksesuar', count: 4 },
    { id: 'powerbank', label: 'Powerbank', count: 4 },
  ]
  const products = {
    hoparlor: [
      { id: 'gh1', n: 'SoundWave Pro X', p: '₺1.899', s: 124 },
      { id: 'gh2', n: 'BassBoom Mini', p: '₺749', s: 87 },
      { id: 'gh3', n: 'StudioMax 360', p: '₺2.450', s: 12 },
      { id: 'gh4', n: 'EchoCore Slim', p: '₺1.149', s: 56 },
    ],
    sarj: [
      { id: 'gs1', n: 'GaN Hızlı Şarj 65W', p: '₺389', s: 230 },
      { id: 'gs2', n: 'Çoklu Port 100W', p: '₺649', s: 78 },
      { id: 'gs3', n: 'Type-C 30W Mini', p: '₺199', s: 412 },
      { id: 'gs4', n: 'MagSafe Wireless', p: '₺259', s: 145 },
    ],
    kablo: [
      { id: 'gk1', n: 'USB-C Naylon 2m', p: '₺79', s: 520 },
      { id: 'gk2', n: 'Lightning MFi 1m', p: '₺59', s: 318 },
      { id: 'gk3', n: 'USB-C 240W Pro', p: '₺119', s: 67 },
      { id: 'gk4', n: 'HDMI 4K 1.5m', p: '₺99', s: 201 },
    ],
    powerbank: [
      { id: 'gp1', n: 'Powerbank 20.000', p: '₺549', s: 184 },
      { id: 'gp2', n: 'MagSafe 10.000', p: '₺699', s: 92 },
      { id: 'gp3', n: 'Slim Cep 5.000', p: '₺249', s: 267 },
      { id: 'gp4', n: 'Pro 30.000 100W', p: '₺899', s: 41 },
    ],
  }

  return (
    <div className="bg-[#0B0F19]">
      {/* Success banner */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="px-5 py-2.5 bg-emerald-500/10 border-b border-emerald-500/20 flex items-center justify-between flex-wrap gap-2"
      >
        <div className="flex items-center gap-2 text-xs text-emerald-300">
          <CheckCircle2 className="w-4 h-4" />
          <span>
            <span className="font-medium">{fileName}</span> başarıyla işlendi · 16 ürün · 4 kategori · 2.9sn
          </span>
        </div>
        <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/15 text-[10px] text-emerald-300 font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          CANLI
        </div>
      </motion.div>

      {/* Sticky conversion CTA */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.18, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="relative px-5 md:px-7 py-5 border-b border-white/5 bg-gradient-to-r from-[#00D2FF]/[0.04] via-[#7928CA]/[0.06] to-[#00D2FF]/[0.04] flex flex-col sm:flex-row items-center justify-between gap-3"
      >
        <div className="text-center sm:text-left">
          <div className="text-sm md:text-base text-white font-semibold">Hazır. Müşterilerinize gönderebilirsiniz.</div>
          <div className="text-[11px] md:text-xs text-slate-400 mt-0.5">14 gün ücretsiz · Kart gerekmez · 1 dakikada canlı</div>
        </div>
        <a
          href="#waitlist"
          className="group relative inline-flex items-center justify-center gap-2 px-6 md:px-7 py-3 rounded-full bg-white text-black text-sm font-semibold whitespace-nowrap hover:scale-[1.03] transition-transform shadow-[0_0_45px_rgba(0,210,255,0.5)] hover:shadow-[0_0_70px_rgba(0,210,255,0.75)]"
        >
          <span className="absolute -inset-px rounded-full bg-gradient-to-r from-[#00D2FF] to-[#7928CA] opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-md" />
          <span className="relative inline-flex items-center gap-2">
            Bu Benim Vitrinim Olsun
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
          </span>
        </a>
      </motion.div>

      {/* Tenant header */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="px-5 md:px-7 py-4 flex items-center justify-between border-b border-white/5"
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#00D2FF] to-[#7928CA] flex items-center justify-center text-white font-bold text-sm shadow-lg">M</div>
          <div>
            <div className="text-sm text-white font-semibold leading-tight">Lucatech İletişim</div>
            <div className="text-[10px] text-slate-500">lucatech.ekatalox.com</div>
          </div>
        </div>
        <div className="hidden md:flex items-center gap-3 flex-1 justify-center max-w-md">
          <div className="flex items-center gap-2 w-full px-3 py-1.5 rounded-full bg-white/5 border border-white/5">
            <Search className="w-3.5 h-3.5 text-slate-500" />
            <span className="text-xs text-slate-500">Ürün, marka veya kod ara…</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 text-[11px] text-white"><ShoppingCart className="w-3 h-3" />0</div>
          <div className="px-3 py-1.5 rounded-full bg-gradient-to-r from-[#00D2FF] to-[#7928CA] text-[11px] text-white font-medium">B2B Giriş</div>
        </div>
      </motion.div>

      {/* Banner */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="px-5 md:px-7 pt-5"
      >
        <div className="aspect-[3/1] rounded-xl overflow-hidden relative bg-gradient-to-br from-[#00D2FF]/20 via-slate-800 to-[#7928CA]/30 border border-white/5">
          <div className="absolute inset-0 bg-grid opacity-30" />
          <div className="absolute inset-0 flex flex-col justify-center px-6 md:px-10">
            <span className="text-[10px] text-[#00D2FF] uppercase tracking-widest font-semibold">Bayilere Özel</span>
            <span className="text-lg md:text-3xl font-bold text-white mt-1">Sezon Açılışı · %25 Avantajlı Fiyatlar</span>
            <span className="text-[11px] md:text-xs text-slate-300 mt-1">Excel'inizden otomatik oluşturuldu</span>
          </div>
          <div className="absolute right-8 top-1/2 -translate-y-1/2 w-24 h-24 md:w-36 md:h-36 rounded-full bg-[#00D2FF]/40 blur-2xl" />
        </div>
      </motion.div>

      {/* Categories */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="px-5 md:px-7 py-4 flex flex-wrap gap-2 overflow-x-auto"
      >
        <LayoutGroup id="gen-tabs">
          {cats.map(c => (
            <button
              key={c.id}
              onClick={() => setActiveCat(c.id)}
              className="relative px-3.5 py-1.5 rounded-full text-xs whitespace-nowrap transition-colors"
            >
              {activeCat === c.id && (
                <motion.span layoutId="genTab" transition={{ type: 'spring', stiffness: 380, damping: 30 }} className="absolute inset-0 rounded-full bg-white" />
              )}
              <span className={`relative inline-flex items-center gap-1.5 ${activeCat === c.id ? 'text-black font-medium' : 'text-slate-300'}`}>
                {c.label}
                <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${activeCat === c.id ? 'bg-black/10 text-black/60' : 'bg-white/5 text-slate-500'}`}>{c.count}</span>
              </span>
            </button>
          ))}
        </LayoutGroup>
      </motion.div>

      {/* Products grid */}
      <div className="px-5 md:px-7 pb-7 grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 relative min-h-[280px]">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={activeCat}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="col-span-2 md:col-span-4 grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4"
          >
            {products[activeCat].map((p, i) => (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, scale: 0.92, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.3, delay: i * 0.05, ease: [0.16, 1, 0.3, 1] }}
                whileHover={{ y: -4 }}
                className="rounded-2xl border border-white/10 bg-white/[0.02] p-3 md:p-4 hover:border-[#00D2FF]/30 transition-colors group"
              >
                <div className="aspect-square rounded-xl bg-gradient-to-br from-slate-700/30 to-slate-900 relative overflow-hidden mb-3">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Layers className="w-7 h-7 text-slate-600" />
                  </div>
                  <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded-md bg-emerald-500/15 text-[9px] text-emerald-300 font-medium">Stok {p.s}</div>
                  <div className="absolute bottom-2 left-2 px-1.5 py-0.5 rounded-md bg-black/40 backdrop-blur text-[9px] text-white">Yeni</div>
                </div>
                <div className="text-xs md:text-sm text-white font-medium truncate">{p.n}</div>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-xs md:text-sm text-[#00D2FF] font-semibold">{p.p}</span>
                  <span className="text-[9px] text-slate-500">1. Liste</span>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Footer CTA */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="px-5 md:px-7 py-5 border-t border-white/5 flex items-center justify-between flex-wrap gap-3 bg-black/20"
      >
        <div className="text-xs text-slate-400">
          Bu vitrini sahiplenmek için <span className="text-white font-medium">14 gün ücretsiz</span> deneme başlatın.
        </div>
        <a href="#baslat" className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-white text-black text-xs font-medium hover:scale-105 transition-transform">
          Bu Vitrini Benimseriyorum
          <ArrowRight className="w-3.5 h-3.5" />
        </a>
      </motion.div>
    </div>
  )
}

// ----------------------------- 3-STEP TIMELINE -------------------------------
const StepSection = () => {
  const steps = [
    {
      n: '01',
      title: "Anlık Excel Entegrasyonu",
      desc: 'Stok listenizi sürükle-bırak ile saniyeler içinde sisteme yükleyin. .xlsx, .xls ve .csv formatları desteklenir.',
      icon: FileSpreadsheet,
      visual: <ExcelDropVisual />,
    },
    {
      n: '02',
      title: 'AI Akıllı Eşleştirme',
      desc: 'Yapay zekâ; para birimlerini (USD, TRY, EUR) temizler, kategorileri çok seviyeli olarak otomatik kurar, eksik alanları tamamlar.',
      icon: Sparkles,
      visual: <AIMatchVisual />,
    },
    {
      n: '03',
      title: 'Vitrin Hazır!',
      desc: "Kendi alt alan adınızda (tenant.ekatalox.com) profesyonel B2B mağazanız anında yayına alınır. Müşterileriniz hemen sipariş verebilir.",
      icon: Store,
      visual: <StoreReadyVisual />,
    },
  ]

  return (
    <section className="relative py-32 md:py-48 px-6 bg-[#0B0F19]">
      <div className="absolute inset-0 bg-grid mask-radial-fade opacity-30" />
      <div className="max-w-6xl mx-auto relative">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false, amount: 0.4 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="text-center mb-20 md:mb-32"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass text-xs text-slate-300 mb-6">
            <Zap className="w-3 h-3 text-[#00D2FF]" />
            1 Dakikalık Süreç
          </div>
          <h2 className="display-headline text-4xl md:text-6xl lg:text-7xl text-white text-balance">
            Excel'den vitrine. <br />
            <span className="text-gradient-neon">Tek nefeste.</span>
          </h2>
          <p className="mt-6 text-lg md:text-xl text-slate-400 max-w-2xl mx-auto font-light">
            Karmaşık kurulum yok. Tema seçimi yok. Sadece dosya. Sadece sonuç.
          </p>
        </motion.div>

        <div className="space-y-32 md:space-y-44">
          {steps.map((s, i) => (
            <StepBlock key={i} step={s} index={i} reverse={i % 2 === 1} />
          ))}
        </div>
      </div>
    </section>
  )
}

const StepBlock = ({ step, index, reverse }) => {
  const container = {
    hidden: {},
    show: { transition: { staggerChildren: 0.18, delayChildren: 0.1 } },
  }
  const item = {
    hidden: { opacity: 0, y: 40 },
    show: { opacity: 1, y: 0, transition: { duration: 0.9, ease: [0.16, 1, 0.3, 1] } },
  }

  return (
    <motion.div
      variants={container}
      initial="hidden"
      whileInView="show"
      viewport={{ once: false, amount: 0.25 }}
      className={`grid md:grid-cols-2 gap-12 md:gap-20 items-center ${reverse ? 'md:[&>*:first-child]:order-2' : ''}`}
    >
      <motion.div variants={item}>
        <div className="flex items-center gap-3 mb-5">
          <span className="text-[#00D2FF] font-mono text-sm tracking-widest">{step.n}</span>
          <div className="flex-1 h-px bg-gradient-to-r from-[#00D2FF]/40 to-transparent" />
        </div>
        <h3 className="display-headline text-3xl md:text-5xl text-white">{step.title}</h3>
        <p className="mt-5 text-base md:text-lg text-slate-400 font-light leading-relaxed max-w-md">{step.desc}</p>
      </motion.div>
      <motion.div variants={item}>
        {step.visual}
      </motion.div>
    </motion.div>
  )
}

const ExcelDropVisual = () => (
  <div className="relative aspect-square max-w-md mx-auto rounded-2xl glass overflow-hidden p-8 flex items-center justify-center">
    <div className="absolute inset-0 bg-grid opacity-20" />
    <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-[#00D2FF]/30 blur-3xl" />
    <motion.div
      animate={{ y: [0, -8, 0], rotate: [-2, 2, -2] }}
      transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
      className="relative w-56 rounded-xl border border-white/10 bg-gradient-to-br from-emerald-900/40 to-slate-900 p-4 shadow-2xl"
    >
      <div className="flex items-center gap-2 mb-3">
        <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
        <span className="text-xs text-white font-medium">stok_listesi.xlsx</span>
      </div>
      <div className="space-y-1.5">
        {[1,2,3,4,5].map(i => (
          <div key={i} className="flex gap-1">
            <div className="flex-1 h-2 rounded bg-white/5" />
            <div className="w-10 h-2 rounded bg-white/5" />
            <div className="w-8 h-2 rounded bg-emerald-400/30" />
          </div>
        ))}
      </div>
    </motion.div>
    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-full bg-white/5 border border-dashed border-white/20 text-[11px] text-slate-400 flex items-center gap-1.5">
      <Upload className="w-3 h-3" /> Bırakmak için sürükleyin
    </div>
  </div>
)

const AIMatchVisual = () => (
  <div className="relative aspect-square max-w-md mx-auto rounded-2xl glass overflow-hidden p-6">
    <div className="absolute -top-10 -left-10 w-40 h-40 rounded-full bg-[#7928CA]/30 blur-3xl" />
    <svg className="absolute inset-0 w-full h-full" viewBox="0 0 400 400" fill="none">
      <defs>
        <linearGradient id="lg1" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#00D2FF" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#7928CA" stopOpacity="0.8" />
        </linearGradient>
      </defs>
      {[
        'M40 80 Q 200 80 360 200',
        'M40 160 Q 200 200 360 80',
        'M40 240 Q 200 280 360 320',
        'M40 320 Q 200 240 360 240',
      ].map((d, i) => (
        <motion.path
          key={i}
          d={d}
          stroke="url(#lg1)"
          strokeWidth="1.5"
          initial={{ pathLength: 0, opacity: 0 }}
          whileInView={{ pathLength: 1, opacity: 0.8 }}
          viewport={{ once: false, amount: 0.4 }}
          transition={{ duration: 1.8, delay: i * 0.2, ease: 'easeInOut' }}
        />
      ))}
    </svg>
    <div className="relative h-full flex flex-col justify-between">
      <div className="space-y-2">
        {['USD 12.50', '€ 9,80', '₺459,90'].map((c, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: false }}
            transition={{ delay: 0.2 + i * 0.15 }}
            className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md glass text-[11px] text-slate-300"
          >
            <DollarSign className="w-3 h-3 text-emerald-400" />
            <span className="line-through opacity-50">{c}</span>
            <ChevronRight className="w-3 h-3" />
            <span className="text-[#00D2FF] font-semibold">₺ Standardize</span>
          </motion.div>
        ))}
      </div>
      <div className="space-y-1.5">
        {[
          ['Elektronik', '/'],
          ['Elektronik / Aksesuar', '//'],
          ['Elektronik / Aksesuar / Kablo', '///'],
        ].map((c, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false }}
            transition={{ delay: 0.5 + i * 0.15 }}
            className="flex items-center gap-2 text-[11px]"
            style={{ paddingLeft: `${i * 14}px` }}
          >
            <span className="text-slate-600 font-mono">{c[1]}</span>
            <span className="text-white">{c[0]}</span>
          </motion.div>
        ))}
      </div>
    </div>
  </div>
)

const StoreReadyVisual = () => (
  <motion.div
    initial={{ opacity: 0.4 }}
    whileInView={{ opacity: 1 }}
    viewport={{ once: false }}
    transition={{ duration: 1 }}
    className="relative aspect-square max-w-md mx-auto rounded-2xl glass overflow-hidden p-5"
  >
    <div className="absolute inset-0 bg-gradient-to-br from-[#00D2FF]/10 via-transparent to-[#7928CA]/10" />
    <div className="relative rounded-xl border border-white/10 bg-[#0B0F19]/80 p-3 h-full flex flex-col">
      <div className="flex items-center gap-1.5 pb-2 border-b border-white/5">
        <div className="w-2 h-2 rounded-full bg-red-500/60" />
        <div className="w-2 h-2 rounded-full bg-yellow-500/60" />
        <div className="w-2 h-2 rounded-full bg-green-500/60" />
        <div className="ml-auto text-[9px] text-slate-500">lucatech.ekatalox.com</div>
      </div>
      <div className="flex items-center justify-between mt-3 pb-2">
        <div className="flex items-center gap-1.5">
          <div className="w-5 h-5 rounded bg-gradient-to-br from-[#00D2FF] to-[#7928CA]" />
          <span className="text-[10px] text-white font-medium">LucaTech</span>
        </div>
        <div className="flex gap-2 text-[8px] text-slate-400"><span>Ürünler</span><span>Kategoriler</span><span>İletişim</span></div>
      </div>
      <div className="grid grid-cols-3 gap-1.5 mt-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0.6 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: false }}
            transition={{ delay: 0.3 + i * 0.08 }}
            className="aspect-square rounded-md bg-gradient-to-br from-slate-700/40 to-slate-900 border border-white/5"
          />
        ))}
      </div>
      <div className="mt-auto pt-3 text-center">
        <div className="inline-flex items-center gap-1.5 text-[10px] text-emerald-400">
          <Check className="w-3 h-3" /> Yayında
        </div>
      </div>
    </div>
  </motion.div>
)

// ----------------------------- BENTO FEATURES --------------------------------
const BentoFeatures = () => {
  return (
    <section className="relative py-32 md:py-48 px-6">
      <div className="absolute top-1/4 right-0 w-[500px] h-[500px] rounded-full bg-[#7928CA]/15 blur-[140px]" />
      <div className="max-w-7xl mx-auto relative">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false, amount: 0.4 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-20"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass text-xs text-slate-300 mb-6">
            <ShieldCheck className="w-3 h-3 text-[#00D2FF]" />
            Hatasız Vitrin Mimarisi
          </div>
          <h2 className="display-headline text-4xl md:text-6xl lg:text-7xl text-white text-balance">
            Detaylarda gizli, <br />
            <span className="text-gradient-neon">teknik üstünlük.</span>
          </h2>
          <p className="mt-6 text-lg md:text-xl text-slate-400 max-w-2xl mx-auto font-light">
            Tüm zor işleri arka planda hallederiz. Siz sadece satışa odaklanırsınız.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-6 gap-4 md:gap-5">
          <BentoCard className="md:col-span-4 min-h-[420px]">
            <DragDropCard />
          </BentoCard>
          <BentoCard className="md:col-span-2 min-h-[420px]">
            <PriceTiersCard />
          </BentoCard>
          <BentoCard className="md:col-span-3 min-h-[380px]">
            <BannerLockCard />
          </BentoCard>
          <BentoCard className="md:col-span-3 min-h-[380px]">
            <ExtraStatsCard />
          </BentoCard>
        </div>
      </div>
    </section>
  )
}

const BentoCard = ({ children, className = '' }) => (
  <motion.div
    initial={{ opacity: 0, y: 30 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: false, amount: 0.2 }}
    transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
    whileHover={{ scale: 1.015 }}
    className={`group relative rounded-3xl border border-white/10 bg-gradient-to-b from-white/[0.04] to-white/[0.01] overflow-hidden p-7 md:p-8 transition-all duration-500 hover:border-white/20 ${className}`}
  >
    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-br from-[#00D2FF]/[0.04] to-[#7928CA]/[0.04]" />
    <div className="relative h-full">{children}</div>
  </motion.div>
)

const DragDropCard = () => {
  const [items, setItems] = useState([
    { id: 'a', name: 'Wireless Hoparlör Pro', price: '₺1.249' },
    { id: 'b', name: 'Hızlı Duvar Şarjı 65W', price: '₺389' },
    { id: 'c', name: 'USB-C Kablo 2m', price: '₺79' },
    { id: 'd', name: 'Powerbank 20.000mAh', price: '₺549' },
  ])

  const move = (from, to) => {
    const newItems = [...items]
    const [m] = newItems.splice(from, 1)
    newItems.splice(to, 0, m)
    setItems(newItems)
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-start justify-between">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-[#00D2FF]/10 text-[#00D2FF] text-[10px] font-medium uppercase tracking-wider">
            <Move className="w-3 h-3" /> Yönetim Paneli
          </div>
          <h3 className="mt-4 text-2xl md:text-3xl font-semibold text-white">Sürükle-Bırak Sıralama</h3>
          <p className="mt-2 text-sm md:text-base text-slate-400 max-w-md">Ürünlerinizin vitrindeki görünüm sırasını gerçek zamanlı olarak değiştirin. Müşterileriniz neyi göreceğini siz belirleyin.</p>
        </div>
      </div>
      <LayoutGroup>
        <div className="mt-6 flex-1 flex flex-col gap-2">
          {items.map((it, i) => (
            <motion.div
              key={it.id}
              layout
              transition={{ type: 'spring', stiffness: 380, damping: 30 }}
              className="flex items-center gap-3 p-3 rounded-xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.06]"
            >
              <div className="flex flex-col gap-1 cursor-grab">
                <div className="flex gap-0.5"><div className="w-1 h-1 rounded-full bg-slate-500" /><div className="w-1 h-1 rounded-full bg-slate-500" /></div>
                <div className="flex gap-0.5"><div className="w-1 h-1 rounded-full bg-slate-500" /><div className="w-1 h-1 rounded-full bg-slate-500" /></div>
                <div className="flex gap-0.5"><div className="w-1 h-1 rounded-full bg-slate-500" /><div className="w-1 h-1 rounded-full bg-slate-500" /></div>
              </div>
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-slate-700/40 to-slate-900 flex items-center justify-center">
                <Layers className="w-4 h-4 text-slate-500" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm text-white truncate">{it.name}</div>
                <div className="text-xs text-[#00D2FF]">{it.price}</div>
              </div>
              <div className="flex flex-col gap-1">
                <button onClick={() => i > 0 && move(i, i - 1)} className="w-6 h-6 rounded-md bg-white/5 hover:bg-white/10 text-slate-400 text-xs">↑</button>
                <button onClick={() => i < items.length - 1 && move(i, i + 1)} className="w-6 h-6 rounded-md bg-white/5 hover:bg-white/10 text-slate-400 text-xs">↓</button>
              </div>
            </motion.div>
          ))}
        </div>
      </LayoutGroup>
    </div>
  )
}

const PriceTiersCard = () => {
  const [currency, setCurrency] = useState('TRY')
  const tiers = {
    TRY: [
      { label: '1. Liste (Bayi)', price: '₺459,90' },
      { label: '2. Liste (Toptancı)', price: '₺419,00' },
      { label: '3. Liste (Anlaşmalı)', price: '₺379,50' },
    ],
    USD: [
      { label: '1. Liste (Bayi)', price: '$14.90' },
      { label: '2. Liste (Toptancı)', price: '$13.50' },
      { label: '3. Liste (Anlaşmalı)', price: '$12.20' },
    ],
  }
  return (
    <div className="h-full flex flex-col">
      <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-[#7928CA]/15 text-[#c084fc] text-[10px] font-medium uppercase tracking-wider w-fit">
        <DollarSign className="w-3 h-3" /> Akıllı Fiyat
      </div>
      <h3 className="mt-4 text-2xl md:text-3xl font-semibold text-white">3 Seviyeli Fiyatlandırma</h3>
      <p className="mt-2 text-sm text-slate-400">Her müşteri profili için ayrı liste fiyatı. Para birimleri otomatik sanitize edilir.</p>

      <div className="mt-5 inline-flex p-1 rounded-full glass w-fit">
        {['TRY', 'USD'].map(c => (
          <button
            key={c}
            onClick={() => setCurrency(c)}
            className={`px-3 py-1 text-xs rounded-full transition-all ${currency === c ? 'bg-white text-black' : 'text-slate-400'}`}
          >
            {c}
          </button>
        ))}
      </div>

      <div className="mt-5 space-y-2">
        <AnimatePresence mode="popLayout" initial={false}>
          {tiers[currency].map((t, i) => (
            <motion.div
              key={`${currency}-${i}`}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ delay: i * 0.08 }}
              className="flex items-center justify-between p-3 rounded-xl border border-white/10 bg-white/[0.02]"
            >
              <span className="text-xs text-slate-400">{t.label}</span>
              <span className="text-sm font-semibold text-white tabular-nums">{t.price}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  )
}

const BannerLockCard = () => (
  <div className="h-full flex flex-col">
    <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-medium uppercase tracking-wider w-fit">
      <ImageIcon className="w-3 h-3" /> Bozulmaz Düzen
    </div>
    <h3 className="mt-4 text-2xl md:text-3xl font-semibold text-white">3:1 Banner Garantisi</h3>
    <p className="mt-2 text-sm text-slate-400 max-w-md">Hangi banner'ı yüklerseniz yükleyin, vitrininizin tasarımı 1200×400 oranında pristine kalır. Asla bozulmaz.</p>

    <div className="mt-5 flex-1 flex flex-col gap-2 justify-center">
      <div className="relative">
        <div className="absolute -top-2 left-3 px-2 py-0.5 rounded-md bg-[#0B0F19] border border-white/10 text-[9px] text-slate-400 z-10">1200 × 400</div>
        <div className="aspect-[3/1] rounded-xl border border-[#00D2FF]/30 bg-gradient-to-br from-[#00D2FF]/15 to-[#7928CA]/15 relative overflow-hidden">
          <div className="absolute inset-0 bg-grid opacity-20" />
          <div className="absolute inset-0 flex items-center justify-center">
            <Check className="w-8 h-8 text-emerald-400" />
          </div>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2 text-[10px] text-center text-slate-400">
        <div className="py-1.5 rounded-md bg-white/[0.03] border border-white/5">Otomatik Crop</div>
        <div className="py-1.5 rounded-md bg-white/[0.03] border border-white/5">Akıllı Hizalama</div>
        <div className="py-1.5 rounded-md bg-white/[0.03] border border-white/5">CDN Optimize</div>
      </div>
    </div>
  </div>
)

const ExtraStatsCard = () => (
  <div className="h-full flex flex-col justify-between">
    <div>
      <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400 text-[10px] font-medium uppercase tracking-wider w-fit">
        <BarChart3 className="w-3 h-3" /> Performans
      </div>
      <h3 className="mt-4 text-2xl md:text-3xl font-semibold text-white">Yıldırım hızında, sınırsız.</h3>
      <p className="mt-2 text-sm text-slate-400">Edge ağı üzerinde, CDN destekli, dakikada binlerce sipariş kaldırabilen B2B altyapısı.</p>
    </div>
    <div className="grid grid-cols-3 gap-3 mt-6">
      {[
        { v: '1dk', l: 'Kurulum' },
        { v: '99.9%', l: 'Uptime' },
        { v: '∞', l: 'Ürün' },
      ].map((s, i) => (
        <div key={i} className="p-4 rounded-xl border border-white/10 bg-white/[0.02] text-center">
          <div className="text-2xl md:text-3xl font-bold text-gradient-neon">{s.v}</div>
          <div className="text-[10px] text-slate-500 uppercase tracking-wider mt-1">{s.l}</div>
        </div>
      ))}
    </div>
  </div>
)

// ----------------------------- COMPARISON TABLE ------------------------------
const Comparison = () => {
  const rows = [
    {
      criteria: 'Kurulum Süresi',
      sub: 'Vitrinin yayına alınma süresi',
      values: [
        { v: '1 dakika', tone: 'good', hint: 'Excel yüklendiği anda' },
        { v: '3 hafta', tone: 'bad', hint: 'Tema, kurulum, geliştirme' },
        { v: 'Günler', tone: 'meh', hint: 'PDF/WhatsApp hazırlığı' },
      ],
    },
    {
      criteria: 'Ürün Güncelleme',
      sub: 'Fiyat ve stok değiştirme yöntemi',
      values: [
        { v: 'Tek tık Excel', tone: 'good', hint: 'Tüm vitrin yenilenir' },
        { v: 'Manuel · tek tek', tone: 'bad', hint: 'Yüzlerce ürün, saatler' },
        { v: 'Sıfırdan revizyon', tone: 'bad', hint: 'Her seferinde baştan' },
      ],
    },
    {
      criteria: 'Tasarım Güvencesi',
      sub: 'Banner ve görsel düzen koruması',
      values: [
        { v: '3:1 akıllı kilit', tone: 'good', hint: 'Hiçbir zaman bozulmaz' },
        { v: 'Bozulan layout', tone: 'bad', hint: 'Banner her oranı kabul eder' },
        { v: 'Yok', tone: 'bad', hint: 'Tasarım disiplini sıfır' },
      ],
    },
    {
      criteria: 'Çoklu Fiyat Listesi',
      sub: 'Bayi / toptan / anlaşmalı seviyeler',
      values: [
        { v: '3 seviye otomatik', tone: 'good', hint: 'Excel sütunlarından' },
        { v: 'Eklenti gerekir', tone: 'meh', hint: 'Ek ücret · kurulum' },
        { v: 'Manuel hesap', tone: 'bad', hint: 'Her müşteriye ayrı PDF' },
      ],
    },
    {
      criteria: 'Para Birimi Yönetimi',
      sub: '₺, $, € otomatik sanitizasyon',
      values: [
        { v: 'Otomatik standardize', tone: 'good', hint: 'AI eşleştirme' },
        { v: 'Tek para birimi', tone: 'meh', hint: 'Kur değişimi manuel' },
        { v: 'Manuel yazım', tone: 'bad', hint: 'Hata oranı yüksek' },
      ],
    },
    {
      criteria: 'B2B Sipariş Akışı',
      sub: 'Profesyonel toptan sipariş deneyimi',
      values: [
        { v: 'Yerleşik B2B', tone: 'good', hint: 'Minimum tutar, MOQ, KDV' },
        { v: 'B2C odaklı', tone: 'bad', hint: 'B2B için yapay çözüm' },
        { v: 'WhatsApp ile', tone: 'bad', hint: 'Sipariş kaybı kaçınılmaz' },
      ],
    },
    {
      criteria: 'Yıllık Toplam Maliyet',
      sub: 'Lisans + bakım + ajans',
      values: [
        { v: '₺20.000 - ₺95.000 / yıl', tone: 'good', hint: 'Her şey dahil' },
        { v: '₺100.000+ / yıl', tone: 'bad', hint: 'Lisans + ajans + hosting' },
        { v: 'Görünmez maliyet', tone: 'bad', hint: 'Zaman = para' },
      ],
    },
  ]

  const columns = [
    { name: 'eKatalox', tag: 'Yeni Nesil', featured: true },
    { name: 'Klasik E-Ticaret Paketleri', tag: 'Geleneksel', featured: false },
    { name: 'Manuel Katalog', tag: 'PDF / WhatsApp', featured: false },
  ]

  return (
    <section id="karsilastirma" className="relative py-32 md:py-44 px-6">
      <div className="absolute top-1/3 left-0 w-[500px] h-[500px] rounded-full bg-[#00D2FF]/10 blur-[160px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-0 w-[500px] h-[500px] rounded-full bg-[#7928CA]/15 blur-[160px] pointer-events-none" />
      <div className="max-w-7xl mx-auto relative">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false, amount: 0.3 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16 md:mb-20"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass text-xs text-slate-300 mb-6">
            <BarChart3 className="w-3 h-3 text-[#00D2FF]" />
            Karşılaştırma
          </div>
          <h2 className="display-headline text-4xl md:text-6xl lg:text-7xl text-white text-balance">
            Diğerleri kurulurken, <br />
            <span className="text-gradient-neon">siz çoktan satıyorsunuz.</span>
          </h2>
          <p className="mt-6 text-lg md:text-xl text-slate-400 max-w-2xl mx-auto font-light">
            Aynı bütçe. Aynı ürünler. Tamamen farklı sonuçlar.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false, amount: 0.15 }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          className="relative rounded-3xl border border-white/10 bg-gradient-to-b from-white/[0.03] to-transparent overflow-hidden"
        >
          {/* Featured column highlight overlay */}
          <div className="hidden md:block absolute inset-y-0 left-[28%] w-[24%] pointer-events-none">
            <div className="absolute inset-0 bg-gradient-to-b from-[#00D2FF]/[0.08] via-[#7928CA]/[0.06] to-transparent" />
            <div className="absolute inset-y-0 left-0 w-px bg-gradient-to-b from-transparent via-[#00D2FF]/60 to-transparent" />
            <div className="absolute inset-y-0 right-0 w-px bg-gradient-to-b from-transparent via-[#7928CA]/60 to-transparent" />
            <div className="absolute -top-px left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#00D2FF] to-transparent" />
            <div className="absolute -inset-x-2 -top-8 h-32 bg-[#00D2FF]/10 blur-3xl" />
          </div>

          {/* Header */}
          <div className="relative grid grid-cols-4 md:grid-cols-[1.4fr_1fr_1fr_1fr] gap-2 md:gap-0 px-4 md:px-6 py-5 md:py-7 border-b border-white/10">
            <div className="hidden md:block text-[11px] uppercase tracking-widest text-slate-500 font-medium self-end">Kriter</div>
            {columns.map((c, i) => (
              <div key={c.name} className={`text-center px-2 ${i === 0 ? 'col-span-2 md:col-span-1' : ''}`}>
                <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] md:text-[10px] uppercase tracking-wider font-medium mb-2 ${
                  c.featured ? 'bg-gradient-to-r from-[#00D2FF] to-[#7928CA] text-white' : 'bg-white/5 text-slate-400'
                }`}>
                  {c.featured && <Sparkles className="w-2.5 h-2.5" />}
                  {c.tag}
                </div>
                <div className={`text-sm md:text-lg font-semibold ${c.featured ? 'text-white' : 'text-slate-300'}`}>
                  {c.name}
                </div>
                {c.featured && (
                  <div className="hidden md:block text-[10px] text-[#00D2FF] mt-1">Önerilen</div>
                )}
              </div>
            ))}
          </div>

          {/* Rows */}
          <div className="relative">
            {rows.map((row, ri) => (
              <ComparisonRow key={ri} row={row} index={ri} />
            ))}
          </div>

          {/* Footer summary */}
          <div className="relative grid grid-cols-1 md:grid-cols-[1.4fr_1fr_1fr_1fr] gap-2 md:gap-0 px-4 md:px-6 py-7 border-t border-white/10 bg-black/20">
            <div className="hidden md:flex items-center text-xs text-slate-500">Sonuç</div>
            <div className="text-center">
              <div className="inline-flex flex-col items-center gap-2">
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#00D2FF]/15 text-[#00D2FF] text-xs font-medium border border-[#00D2FF]/30">
                  <Check className="w-3 h-3" /> Kazanan
                </div>
                <a href="#baslat" className="text-xs text-white hover:text-[#00D2FF] underline-offset-4 hover:underline">Hemen başla →</a>
              </div>
            </div>
            <div className="text-center text-[11px] text-slate-500">Yavaş ve pahalı</div>
            <div className="text-center text-[11px] text-slate-500">Modası geçmiş</div>
          </div>
        </motion.div>

        {/* Mobile note */}
        <div className="mt-4 text-center text-[11px] text-slate-500 md:hidden">
          ← Tabloyu yatay kaydırın
        </div>
      </div>
    </section>
  )
}

const ComparisonRow = ({ row, index }) => {
  const tones = {
    good: { dot: 'bg-emerald-400', text: 'text-white', icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> },
    meh:  { dot: 'bg-amber-400',   text: 'text-slate-300', icon: <ChevronRight className="w-3.5 h-3.5 text-amber-400" /> },
    bad:  { dot: 'bg-red-400/70',  text: 'text-slate-400', icon: <ChevronRight className="w-3.5 h-3.5 text-red-400/80" /> },
  }
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: false, amount: 0.4 }}
      transition={{ duration: 0.5, delay: index * 0.06, ease: [0.16, 1, 0.3, 1] }}
      className="relative grid grid-cols-1 md:grid-cols-[1.4fr_1fr_1fr_1fr] gap-2 md:gap-0 px-4 md:px-6 py-5 md:py-6 border-b border-white/5 hover:bg-white/[0.02] transition-colors"
    >
      <div className="md:pr-6">
        <div className="text-sm md:text-base font-medium text-white">{row.criteria}</div>
        <div className="text-[11px] md:text-xs text-slate-500 mt-0.5">{row.sub}</div>
      </div>
      {row.values.map((val, vi) => {
        const t = tones[val.tone]
        const isFeatured = vi === 0
        return (
          <div key={vi} className="md:text-center md:px-3">
            <div className="md:hidden inline-flex items-center gap-1.5 mb-1 text-[10px] text-slate-500 uppercase tracking-wider">
              <div className={`w-1.5 h-1.5 rounded-full ${t.dot}`} />
              {vi === 0 ? 'eKatalox' : vi === 1 ? 'Klasik E-Ticaret' : 'Manuel Katalog'}
            </div>
            <div className={`inline-flex items-center justify-center gap-1.5 ${isFeatured ? 'font-semibold' : ''}`}>
              {t.icon}
              <span className={`text-sm md:text-base ${t.text} ${isFeatured ? 'text-white' : ''}`}>{val.v}</span>
            </div>
            <div className={`text-[10px] md:text-[11px] mt-0.5 ${isFeatured ? 'text-slate-400' : 'text-slate-600'}`}>
              {val.hint}
            </div>
          </div>
        )
      })}
    </motion.div>
  )
}

// ----------------------------- DEMO ACCORDION --------------------------------
const DemoSection = () => {
  const categories = [
    { id: 'hoparlor', label: 'Wireless Hoparlör' },
    { id: 'sarj', label: 'Duvar Şarj Cihazı' },
    { id: 'kablo', label: 'USB-C Kablolar' },
    { id: 'powerbank', label: 'Powerbank' },
  ]
  const products = {
    hoparlor: [
      { id: 'h1', n: 'SoundWave Pro X', p: '₺1.899', t: 'Premium' },
      { id: 'h2', n: 'BassBoom Mini', p: '₺749', t: 'Taşınabilir' },
      { id: 'h3', n: 'StudioMax 360', p: '₺2.450', t: 'Stüdyo' },
      { id: 'h4', n: 'EchoCore Slim', p: '₺1.149', t: 'Standart' },
    ],
    sarj: [
      { id: 's1', n: 'Hızlı Şarj 65W', p: '₺389', t: 'GaN' },
      { id: 's2', n: 'Çoklu Port 100W', p: '₺649', t: '4-Port' },
      { id: 's3', n: 'Type-C 30W', p: '₺199', t: 'Mini' },
      { id: 's4', n: 'Wireless 15W', p: '₺259', t: 'Magnet' },
    ],
    kablo: [
      { id: 'k1', n: 'USB-C 2m Naylon', p: '₺79', t: '100W' },
      { id: 'k2', n: 'Lightning 1m', p: '₺59', t: 'MFi' },
      { id: 'k3', n: 'USB-C 3m Pro', p: '₺119', t: '240W' },
      { id: 'k4', n: 'Mikro USB 0.5m', p: '₺39', t: 'Klasik' },
    ],
    powerbank: [
      { id: 'p1', n: 'Powerbank 20.000', p: '₺549', t: 'PD 20W' },
      { id: 'p2', n: 'MagSafe 10.000', p: '₺699', t: 'Wireless' },
      { id: 'p3', n: 'Slim 5.000', p: '₺249', t: 'Cep' },
      { id: 'p4', n: 'Pro 30.000', p: '₺899', t: '100W' },
    ],
  }
  const [active, setActive] = useState('hoparlor')

  return (
    <section id="demo" className="relative py-32 md:py-48 px-6">
      <div className="absolute top-1/2 left-0 w-[500px] h-[500px] rounded-full bg-[#00D2FF]/10 blur-[140px]" />
      <div className="max-w-6xl mx-auto relative">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false, amount: 0.4 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass text-xs text-slate-300 mb-6">
            <Sparkles className="w-3 h-3 text-[#00D2FF]" />
            Canlı Demo
          </div>
          <h2 className="display-headline text-4xl md:text-6xl text-white text-balance">
            Bir vitrin nasıl <span className="text-gradient-neon">hissedilir?</span>
          </h2>
          <p className="mt-6 text-lg text-slate-400 max-w-2xl mx-auto font-light">
            Kategoriler arasında geçiş yapın. Ürünlerin nasıl yumuşakça yerleştiğine dikkat edin.
          </p>
        </motion.div>

        <div className="rounded-3xl border border-white/10 bg-gradient-to-b from-white/[0.04] to-transparent overflow-hidden">
          {/* Browser bar */}
          <div className="flex items-center gap-2 px-5 py-3 border-b border-white/5 bg-black/30">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-500/70" />
              <div className="w-3 h-3 rounded-full bg-yellow-500/70" />
              <div className="w-3 h-3 rounded-full bg-green-500/70" />
            </div>
            <div className="flex-1 flex justify-center">
              <div className="px-4 py-1 rounded-md bg-white/5 text-[11px] text-slate-400 flex items-center gap-1.5">
                <Globe className="w-3 h-3" /> tenant.ekatalox.com
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="px-6 py-5 flex flex-wrap gap-2 border-b border-white/5 overflow-x-auto">
            <LayoutGroup id="demo-tabs">
              {categories.map(c => (
                <button
                  key={c.id}
                  onClick={() => setActive(c.id)}
                  className="relative px-4 py-2 text-xs md:text-sm rounded-full whitespace-nowrap transition-colors"
                >
                  {active === c.id && (
                    <motion.span
                      layoutId="activeTab"
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                      className="absolute inset-0 rounded-full bg-white"
                    />
                  )}
                  <span className={`relative ${active === c.id ? 'text-black font-medium' : 'text-slate-300 hover:text-white'}`}>{c.label}</span>
                </button>
              ))}
            </LayoutGroup>
          </div>

          {/* Products */}
          <div className="p-6 grid grid-cols-2 md:grid-cols-4 gap-4 min-h-[360px] relative">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={active}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                className="col-span-2 md:col-span-4 grid grid-cols-2 md:grid-cols-4 gap-4"
              >
                {products[active].map((p, i) => (
                  <motion.div
                    key={p.id}
                    initial={{ opacity: 0, scale: 0.92, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ duration: 0.35, delay: i * 0.05, ease: [0.16, 1, 0.3, 1] }}
                    whileHover={{ y: -4 }}
                    className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 hover:border-[#00D2FF]/30 hover:bg-white/[0.04] transition-colors"
                  >
                    <div className="aspect-square rounded-xl bg-gradient-to-br from-slate-700/30 to-slate-900 relative overflow-hidden mb-3">
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Layers className="w-8 h-8 text-slate-600" />
                      </div>
                      <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded-md bg-[#00D2FF]/15 text-[9px] text-[#00D2FF] font-medium">{p.t}</div>
                    </div>
                    <div className="text-xs md:text-sm text-white font-medium truncate">{p.n}</div>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-xs md:text-sm text-[#00D2FF] font-semibold">{p.p}</span>
                      <span className="text-[10px] text-slate-500">1. Fiyat</span>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  )
}

// ----------------------------- ALEX AI WHATSAPP SIM --------------------------
const AlexWhatsApp = () => {
  const messages = [
    { from: 'user',  text: 'Alex, depoda MagSafe kılıf kaç adet kaldı?', time: '14:32' },
    { from: 'alex',  text: 'Canlı stok kontrolü yapıldı: 142 adet kaldı. Son 24 saatte 18 adet satıldı.', time: '14:32' },
    { from: 'user',  text: "Ahmet Toptan'a 20 adet sipariş oluştur, ödeme talimatını ilet.", time: '14:33' },
    { from: 'alex',  text: "Sipariş ön muhasebeye işlendi. Ödeme talimatı Ahmet Toptan'a WhatsApp üzerinden iletildi. ⚡", time: '14:33' },
  ]
  return (
    <section className="relative py-28 md:py-36 px-6">
      <div className="absolute top-1/2 left-0 w-[600px] h-[600px] rounded-full bg-[#7928CA]/20 blur-[160px] pointer-events-none" />
      <div className="absolute top-1/3 right-0 w-[500px] h-[500px] rounded-full bg-[#00D2FF]/10 blur-[140px] pointer-events-none" />
      <div className="max-w-7xl mx-auto relative">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Copy */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: false, amount: 0.3 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r from-[#7928CA]/15 to-[#00D2FF]/15 border border-[#7928CA]/30 text-[11px] text-[#c084fc] mb-6">
              <Sparkles className="w-3 h-3" />
              ALEX AI · WhatsApp Üzerinden
            </div>
            <h2 className="display-headline text-4xl md:text-5xl lg:text-6xl text-white text-balance">
              Yazın. <span className="text-gradient-neon">Alex hallediyor.</span>
            </h2>
            <p className="mt-5 text-lg text-slate-400 font-light max-w-md leading-relaxed">
              Kurumsal planda otonom AI asistanınız Alex; sipariş işlemeden tahsilata, stok analizinden muhasebe entegrasyonuna kadar tüm operasyonel yükü WhatsApp üzerinden otonom biçimde yönetir.
            </p>
            <div className="mt-8 grid grid-cols-2 gap-3 max-w-md">
              {[
                ['Otonom Sipariş Yönetimi', 'WhatsApp doğal dil arayüzü'],
                ['Otonom Tahsilat ve Ödeme', 'PayTR / iZico entegrasyonu'],
                ['Otomatik Vadeli Tahsilat', 'Kurumsal hatırlatma akışı'],
                ['Anlık Stok Zekası', 'Doğal dil sorgu motoru'],
              ].map(([t, s]) => (
                <div key={t} className="p-3 rounded-xl border border-white/10 bg-white/[0.02]">
                  <div className="text-sm text-white font-medium">{t}</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">{s}</div>
                </div>
              ))}
            </div>
            <a href="#fiyatlandirma" className="mt-8 inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white text-black text-sm font-medium hover:scale-[1.02] transition-transform">
              Kurumsal Planı Keşfet <ArrowRight className="w-4 h-4" />
            </a>
          </motion.div>

          {/* Phone mockup */}
          <motion.div
            initial={{ opacity: 0, y: 40, rotate: -2 }}
            whileInView={{ opacity: 1, y: 0, rotate: 0 }}
            viewport={{ once: false, amount: 0.2 }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
            className="relative mx-auto"
            style={{ perspective: 1000 }}
          >
            {/* Glow */}
            <div className="absolute -inset-10 rounded-[60px] bg-gradient-to-br from-[#00D2FF]/20 via-transparent to-[#7928CA]/30 blur-3xl pointer-events-none" />

            <div className="relative mx-auto w-[320px] md:w-[360px] rounded-[44px] bg-gradient-to-b from-slate-800 to-slate-950 p-2 border border-white/10 shadow-[0_30px_120px_-20px_rgba(0,210,255,0.35)]">
              {/* Screen */}
              <div className="relative rounded-[36px] bg-[#0a0e15] overflow-hidden">
                {/* Notch */}
                <div className="absolute top-2 left-1/2 -translate-x-1/2 w-24 h-6 rounded-full bg-black z-20" />

                {/* WhatsApp top bar */}
                <div className="relative pt-8 pb-3 px-4 bg-gradient-to-b from-[#0f1820] to-[#0a0e15] border-b border-white/5 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#00D2FF] to-[#7928CA] flex items-center justify-center text-white text-xs font-bold border border-white/20">A</div>
                  <div className="flex-1">
                    <div className="text-sm text-white font-semibold flex items-center gap-1.5">
                      Alex
                      <Sparkles className="w-3 h-3 text-[#00D2FF]" />
                    </div>
                    <div className="text-[10px] text-emerald-400 flex items-center gap-1">
                      <span className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse" />
                      çevrimiçi · yazıyor…
                    </div>
                  </div>
                  <div className="text-[10px] text-slate-500">eKatalox</div>
                </div>

                {/* Chat area */}
                <div className="px-3 py-4 space-y-2.5 min-h-[440px] bg-[url('data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2240%22 height=%2240%22%3E%3Cpath d=%22M0 39h40M39 0v40%22 stroke=%22%23ffffff05%22/%3E%3C/svg%3E')]">
                  {messages.map((m, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 8, scale: 0.95 }}
                      whileInView={{ opacity: 1, y: 0, scale: 1 }}
                      viewport={{ once: false, amount: 0.5 }}
                      transition={{ delay: 0.25 + i * 0.18, duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                      className={`flex ${m.from === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`relative max-w-[78%] px-3 py-2 rounded-2xl text-[12px] leading-snug ${
                        m.from === 'user'
                          ? 'bg-gradient-to-br from-emerald-600/90 to-emerald-700/90 text-white rounded-tr-sm'
                          : 'bg-gradient-to-br from-[#7928CA]/30 to-[#00D2FF]/20 border border-white/10 text-slate-100 rounded-tl-sm'
                      }`}>
                        {m.from === 'alex' && (
                          <div className="flex items-center gap-1 mb-1">
                            <Sparkles className="w-2.5 h-2.5 text-[#00D2FF]" />
                            <span className="text-[9px] uppercase tracking-widest text-[#00D2FF] font-medium">Alex AI</span>
                          </div>
                        )}
                        <div>{m.text}</div>
                        <div className={`text-[9px] mt-1 flex items-center gap-0.5 ${m.from === 'user' ? 'text-emerald-200/70 justify-end' : 'text-slate-500'}`}>
                          {m.time}
                          {m.from === 'user' && (
                            <span className="ml-0.5">✓✓</span>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}

                  {/* typing indicator */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: false }}
                    transition={{ delay: 1.4 }}
                    className="flex justify-start"
                  >
                    <div className="px-3 py-2 rounded-2xl bg-white/[0.05] border border-white/5 flex gap-1">
                      {[0, 1, 2].map(i => (
                        <motion.div
                          key={i}
                          className="w-1.5 h-1.5 rounded-full bg-slate-500"
                          animate={{ opacity: [0.3, 1, 0.3] }}
                          transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.18 }}
                        />
                      ))}
                    </div>
                  </motion.div>
                </div>

                {/* Input bar */}
                <div className="px-3 py-3 border-t border-white/5 bg-[#0f1820] flex items-center gap-2">
                  <div className="flex-1 px-3 py-2 rounded-full bg-white/5 text-[11px] text-slate-500">Bir mesaj yazın…</div>
                  <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center">
                    <ArrowRight className="w-3.5 h-3.5 text-white" />
                  </div>
                </div>
              </div>
            </div>

            {/* Floating sparkles */}
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute -top-4 -right-2 px-3 py-1.5 rounded-full bg-[#0B0F19] border border-[#00D2FF]/40 text-[10px] text-[#00D2FF] font-medium flex items-center gap-1.5 shadow-[0_0_30px_rgba(0,210,255,0.3)]"
            >
              <Sparkles className="w-3 h-3" /> AI Powered
            </motion.div>
            <motion.div
              animate={{ y: [0, 8, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
              className="absolute -bottom-2 -left-4 px-3 py-1.5 rounded-full bg-[#0B0F19] border border-emerald-500/40 text-[10px] text-emerald-400 font-medium flex items-center gap-1.5 shadow-[0_0_30px_rgba(16,185,129,0.3)]"
            >
              <Check className="w-3 h-3" /> 0.4sn yanıt
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}

// ----------------------------- TRUST STATS -----------------------------------
const TrustStats = () => {
  const stats = [
    { v: '1 Milyon+', l: 'WhatsApp Üzerinden Çözülen Sipariş Satırı' },
    { v: '%95',       l: 'Katalog Güncelleme ve Operasyon Zaman Tasarrufu' },
    { v: '1 Dakika',  l: "Excel'den Canlı Yayına Geçiş Süresi" },
  ]
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: false, amount: 0.3 }}
      transition={{ duration: 0.8 }}
      className="relative mb-16 md:mb-20"
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5 max-w-5xl mx-auto">
        {stats.map((s, i) => (
          <motion.div
            key={s.l}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false, amount: 0.4 }}
            transition={{ duration: 0.6, delay: i * 0.1 }}
            className="group relative p-6 md:p-7 rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.04] to-transparent hover:border-white/20 transition-colors overflow-hidden text-center"
          >
            <div className="absolute -top-12 -right-12 w-32 h-32 rounded-full bg-[#00D2FF]/8 blur-2xl opacity-50 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="relative">
              <div className="text-4xl md:text-5xl font-bold tracking-tight text-gradient-neon" style={{ letterSpacing: '-0.03em' }}>
                {s.v}
              </div>
              <div className="mt-3 text-xs md:text-sm text-slate-400 leading-relaxed max-w-[240px] mx-auto">
                {s.l}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  )
}

// ----------------------------- FAQ -------------------------------------------
const FAQ = () => {
  const faqs = [
    {
      q: 'Kendi Excel şablonumu kullanabilir miyim?',
      a: 'Evet. eKatalox yapay zekası, Excel sütunlarınızın adı ne olursa olsun fiyat, stok ve ürün isimlerini otomatik olarak tanır ve eşleştirir.',
    },
    {
      q: 'Yapay Zeka Alex hangi muhasebe programlarıyla uyumlu?',
      a: "Logo, Mikro, Paraşüt, Ticimax, Zirve ve Bizimhesap dahil Türkiye'de en çok kullanılan tüm ERP ve ön muhasebe yazılımlarıyla tam entegre çalışır.",
    },
    {
      q: 'Kataloğumu dış dünyaya kapatıp sadece bayilerime özel yapabilir miyim?',
      a: 'Kesinlikle. Tek tıkla şifreli giriş modunu aktif ederek fiyatlarınızı ve ürünlerinizi sadece onayladığınız bayilerinize açabilirsiniz.',
    },
    {
      q: 'Müşterilerimin sipariş vermesi için bir uygulama indirmesi gerekir mi?',
      a: 'Hayır. Müşterileriniz linkinize tıklar, ürünleri sepete ekler ve doğrudan kendi WhatsApp uygulamaları üzerinden yapılandırılmış sipariş formunu iletir.',
    },
  ]
  const [open, setOpen] = useState(0)

  return (
    <section id="faq" className="relative py-28 md:py-40 px-6">
      <div className="absolute top-1/2 left-1/3 w-[500px] h-[500px] rounded-full bg-[#00D2FF]/10 blur-[160px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] rounded-full bg-[#7928CA]/10 blur-[140px] pointer-events-none" />
      <div className="max-w-3xl mx-auto relative">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false, amount: 0.3 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-14"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass text-xs text-slate-300 mb-6">
            <HelpCircle className="w-3 h-3 text-[#00D2FF]" />
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
                  ? 'border-[#00D2FF]/40 from-[#00D2FF]/[0.06] to-transparent'
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
                    open === i ? 'bg-gradient-to-br from-[#00D2FF] to-[#7928CA] text-white' : 'bg-white/5 text-slate-400'
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
          Cevabını bulamadığınız bir sorunuz mu var? <a href="/iletisim" className="text-white hover:text-[#00D2FF] underline-offset-4 hover:underline">Bizimle iletişime geçin →</a>
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
    tag: 'Alex AI Enabled',
    aiPowered: true,
    desc: 'Yapay zeka destekli, WhatsApp üzerinden tam otomasyon.',
    cta: 'Satışla Görüşün',
    featured: false,
    features: [
      'Akıllı Stok Yönetimi & Sınırsız Fiyat Listesi',
      'Yapay Zeka Asistanı Alex: WhatsApp üzerinden Alex ile yazışarak sipariş yönetimi ve anlık sesli/yazılı raporlama.',
      'Alex ile Akıllı Ödeme Altyapısı: PayTR/iyzico entegrasyonu ile WhatsApp üzerinden otomatik ödeme talimatı ve gelen ödemelerin sisteme otonom entegrasyonu.',
      'Otonom Tahsilat ve Ödeme: Vadesi gelen borçlar için Alex tarafından otomatik kurumsal WhatsApp hatırlatma akışı ve ödeme takibi.',
      "Alex ile WhatsApp'tan Muhasebe Kaydı: Sadece yazışarak stok girişleri ve cari hesap güncellemeleri.",
      'Saha Satış Temsilcisi (Plasiyer) Modülü & White-Label Desteği',
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
      <div className="absolute top-1/4 right-1/4 w-[500px] h-[500px] rounded-full bg-[#7928CA]/15 blur-[160px] pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-[500px] h-[500px] rounded-full bg-[#00D2FF]/10 blur-[160px] pointer-events-none" />
      <div className="max-w-7xl mx-auto relative">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false, amount: 0.3 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-10 md:mb-12"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass text-xs text-slate-300 mb-6">
            <DollarSign className="w-3 h-3 text-[#00D2FF]" />
            Fiyatlandırma
          </div>
          <h2 className="display-headline text-4xl md:text-6xl lg:text-7xl text-white text-balance">
            Şeffaf fiyatlar. <br />
            <span className="text-gradient-neon">Saklı ücret yok.</span>
          </h2>
          <p className="mt-6 text-lg md:text-xl text-slate-400 max-w-2xl mx-auto font-light">
            İhtiyacınıza uygun planı seçin. Yıllık ödemede 2 ay hediye.
          </p>
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

        <TrustStats />

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
          Tüm planlar 14 gün ücretsiz denemeyle başlar · Fiyatlara KDV dahildir. Kredi kartına 12 aya varan taksit imkanı.
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
          <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-[#00D2FF] via-[#7928CA] to-[#00D2FF] opacity-90" />
          <div className="absolute -inset-1 rounded-3xl bg-gradient-to-br from-[#00D2FF]/40 to-[#7928CA]/40 blur-2xl opacity-60 group-hover:opacity-100 transition-opacity duration-500" />
        </>
      )}
      {!plan.featured && !plan.aiPowered && (
        <div className="absolute inset-0 rounded-3xl border border-white/10 group-hover:border-white/20 transition-colors duration-500" />
      )}
      {plan.aiPowered && (
        <>
          <div className="absolute inset-0 rounded-3xl border border-[#7928CA]/40 group-hover:border-[#7928CA]/70 transition-colors duration-500" />
          <div className="absolute -inset-1 rounded-3xl bg-gradient-to-br from-[#7928CA]/25 to-transparent blur-2xl opacity-40 group-hover:opacity-70 transition-opacity duration-500" />
        </>
      )}

      <div className={`relative rounded-3xl bg-[#0B0F19] p-6 md:p-7 h-full flex flex-col`}>
        {plan.aiPowered && (
          <>
            <div className="absolute inset-0 rounded-3xl pointer-events-none" style={{ background: 'radial-gradient(circle at top right, rgba(121,40,202,0.18), transparent 60%)' }} />
            <div className="absolute -top-px right-12 left-12 h-px bg-gradient-to-r from-transparent via-[#7928CA] to-transparent" />
          </>
        )}
        <div className="relative flex items-center justify-between mb-4">
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-medium uppercase tracking-wider ${
            plan.featured
              ? 'bg-gradient-to-r from-[#00D2FF] to-[#7928CA] text-white'
              : plan.aiPowered
                ? 'bg-gradient-to-r from-[#7928CA] to-[#00D2FF] text-white shadow-[0_0_20px_rgba(121,40,202,0.45)]'
                : 'bg-white/5 text-slate-400'
          }`}>
            {(plan.featured || plan.aiPowered) && <Sparkles className="w-3 h-3" />}
            {plan.tag}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {Icon && <Icon className={`w-5 h-5 ${plan.featured || plan.aiPowered ? 'text-[#00D2FF]' : 'text-slate-400'}`} />}
          <h3 className="text-xl md:text-2xl font-semibold text-white">{plan.name}</h3>
        </div>
        <p className="mt-2 text-sm text-slate-400 min-h-[40px]">{plan.desc}</p>

        <div className="mt-4 flex items-baseline gap-2">
          <span className={`text-3xl md:text-4xl font-bold tracking-tight ${plan.featured || plan.aiPowered ? 'text-gradient-neon' : 'text-white'}`}>
            {plan.price}
          </span>
          <span className="text-sm text-slate-500">{plan.unit}</span>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/5 text-[11px] text-slate-300">
            <Package className="w-3 h-3 text-[#00D2FF]" />
            {plan.productCapacity}
          </span>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/5 text-[11px] text-slate-300">
            <Users className="w-3 h-3 text-[#00D2FF]" />
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
                  isInherit ? 'bg-emerald-500/25' : plan.featured ? 'bg-[#00D2FF]/20' : 'bg-white/5'
                }`}>
                  <Check className={`w-2.5 h-2.5 ${isInherit ? 'text-emerald-300' : plan.featured ? 'text-[#00D2FF]' : 'text-emerald-400'}`} strokeWidth={3} />
                </div>
                {f}
              </li>
            )
          })}
        </ul>

        <a
          href="#waitlist"
          className={`mt-8 inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full font-medium text-sm transition-all duration-300 ${
            plan.featured
              ? 'bg-white text-black hover:scale-[1.02] shadow-[0_0_40px_rgba(0,210,255,0.3)]'
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

// ----------------------------- WAITLIST --------------------------------------
const Waitlist = () => {
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  const submit = (e) => {
    e.preventDefault()
    setError('')
    const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
    if (!isValid) {
      setError('Lütfen geçerli bir e-posta adresi girin.')
      return
    }
    setSubmitted(true)
  }

  return (
    <section id="waitlist" className="relative py-28 md:py-40 px-6">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] rounded-full bg-[#00D2FF]/10 blur-[160px] pointer-events-none" />
      <div className="max-w-4xl mx-auto relative">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false, amount: 0.3 }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          className="relative rounded-3xl border border-white/10 bg-gradient-to-b from-white/[0.04] to-transparent p-8 md:p-14 overflow-hidden text-center"
        >
          <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-[600px] h-[300px] rounded-full bg-[#7928CA]/20 blur-[120px]" />
          <div className="relative">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full glass text-[11px] text-slate-300 mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00D2FF] animate-pulse" />
              Erken Erişim · Sınırlı Kontenjan
            </div>
            <h2 className="display-headline text-3xl md:text-5xl lg:text-6xl text-white text-balance">
              Sınırlı kontenjan ile <br />
              <span className="text-gradient-neon">erken erişime katılın.</span>
            </h2>
            <p className="mt-5 text-base md:text-lg text-slate-400 max-w-xl mx-auto font-light">
              İlk 500 işletme için %50 indirim ve özel onboarding desteği. Sıranız bizdedir.
            </p>

            <div className="mt-10 max-w-md mx-auto">
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
                    <div className={`flex items-center gap-2 p-1.5 rounded-full border bg-black/30 backdrop-blur-xl transition-colors ${
                      error ? 'border-red-500/60' : 'border-white/10 focus-within:border-[#00D2FF]/60'
                    }`}>
                      <input
                        type="email"
                        placeholder="kurumsal@firmaniz.com"
                        value={email}
                        onChange={(e) => { setEmail(e.target.value); setError('') }}
                        className="flex-1 bg-transparent px-4 py-2.5 text-sm text-white placeholder:text-slate-500 outline-none"
                      />
                      <button
                        type="submit"
                        className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium hover:scale-[1.03] transition-transform whitespace-nowrap"
                      >
                        Sıraya Katıl
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    {error && (
                      <motion.div
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-3 text-xs text-red-400"
                      >
                        {error}
                      </motion.div>
                    )}
                    <div className="mt-4 flex items-center justify-center gap-5 text-[11px] text-slate-500">
                      <div className="flex items-center gap-1.5"><ShieldCheck className="w-3 h-3" />Spam yok</div>
                      <div className="flex items-center gap-1.5"><Zap className="w-3 h-3" />Anında onay</div>
                      <div className="flex items-center gap-1.5"><Check className="w-3 h-3" />İstediğiniz an çıkış</div>
                    </div>
                  </motion.form>
                ) : (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, scale: 0.9, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                    className="relative"
                  >
                    <motion.div
                      initial={{ scale: 0, rotate: -45 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ delay: 0.15, type: 'spring', stiffness: 220, damping: 14 }}
                      className="relative mx-auto w-20 h-20 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-400 flex items-center justify-center shadow-[0_0_60px_rgba(16,185,129,0.5)]"
                    >
                      <CheckCircle2 className="w-10 h-10 text-white" strokeWidth={2.5} />
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
                      className="mt-6 text-xl md:text-2xl font-semibold text-white"
                    >
                      Harika! Sıranız ayrıldı.
                    </motion.h3>
                    <motion.p
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.45 }}
                      className="mt-2 text-sm md:text-base text-slate-400 max-w-md mx-auto"
                    >
                      Yakında sizinle iletişime geçeceğiz. <span className="text-white font-medium">{email}</span> adresini gelen kutunuzdan takip edin.
                    </motion.p>
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.55 }} className="mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-[#00D2FF]/15 to-[#7928CA]/15 border border-[#00D2FF]/40 text-sm text-white shadow-[0_0_30px_rgba(0,210,255,0.25)]">
                      <Sparkles className="w-3.5 h-3.5 text-[#00D2FF]" />
                      Sıra Numaranız: <span className="font-mono text-gradient-neon font-semibold">#{2400 + Math.floor(Math.random() * 200)}</span>
                    </motion.div>
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.7 }}
                      className="mt-4 text-[11px] md:text-xs text-slate-500 max-w-sm mx-auto"
                    >
                      Erken erişim kontenjanı dolmadan ekibimiz sizinle iletişime geçecektir.
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

// ----------------------------- FINAL CTA + FOOTER ---------------------------
const FinalCTA = () => (
  <section id="baslat" className="relative py-40 md:py-56 px-6 overflow-hidden">
    <div className="absolute inset-0">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[900px] rounded-full bg-[#7928CA]/20 blur-[160px]" />
      <div className="absolute top-1/3 left-1/4 w-[500px] h-[500px] rounded-full bg-[#00D2FF]/15 blur-[140px]" />
    </div>
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: false, amount: 0.3 }}
      transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
      className="max-w-5xl mx-auto text-center relative"
    >
      <h2 className="display-headline text-5xl sm:text-6xl md:text-7xl lg:text-8xl text-white text-balance">
        Dükkanınızı <br />
        <span className="text-gradient-neon">Hantallıktan Kurtarın.</span>
      </h2>
      <p className="mt-8 text-lg md:text-2xl text-slate-400 font-light max-w-2xl mx-auto">
        Bugün başlayın. Yarın siparişler düşmeye başlasın.
      </p>
      <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-4">
        <a href="/kayit" className="group inline-flex items-center gap-2 px-10 py-5 rounded-full bg-white text-black font-medium text-base hover:scale-[1.03] transition-all duration-300 shadow-[0_0_60px_rgba(0,210,255,0.3)] hover:shadow-[0_0_80px_rgba(0,210,255,0.5)]">
          14 Gün Ücretsiz Dene
          <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
        </a>
        <a href="/iletisim" className="text-slate-400 hover:text-white transition-colors text-sm">veya satış ekibimizle konuşun →</a>
      </div>
    </motion.div>
  </section>
)

const Footer = () => (
  <footer className="relative border-t border-white/5 bg-[#0B0F19]">
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

        <FooterCol title="Ürün" items={[['Özellikler','#demo'], ['Fiyatlandırma','#fiyatlandirma'], ['Demo','#demo'], ['Yenilikler','/yenilikler'], ['Yol Haritası','/yenilikler']]} />
        <FooterCol title="Şirket" items={[['Hakkımızda','/hakkimizda'], ['Müşteriler','/musteriler'], ['İletişim','/iletisim'], ['Kariyer','/hakkimizda'], ['Basın','/iletisim']]} />
        <FooterCol title="Destek" items={[['Dokümantasyon','/yardim'], ['Yardım Merkezi','/yardim'], ['API','/yardim'], ['Durum','/yardim'], ['İletişim','/iletisim']]} />
      </div>

      <div className="mt-16 pt-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-500">
        <div>© 2025 eKatalox. Tüm hakları saklıdır.</div>
        <div className="flex gap-6">
          <a href="#" className="hover:text-white">Gizlilik</a>
          <a href="#" className="hover:text-white">Kullanım Şartları</a>
          <a href="#" className="hover:text-white">KVKK</a>
          <a href="#" className="hover:text-white">Çerezler</a>
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
    <div className="backdrop-blur-xl bg-[#0B0F19]/60 border-b border-white/5">
      <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
        <Link href="/#top" className="flex items-center gap-2">
          <EkataloxLogo className="h-8 w-[148px]" priority />
        </Link>
        <div className="hidden md:flex items-center gap-8 text-sm text-slate-300">
          <a href="#demo" className="hover:text-white transition-colors">Özellikler</a>
          <Link href="/musteriler" className="hover:text-white transition-colors">Müşteriler</Link>
          <a href="#fiyatlandirma" className="hover:text-white transition-colors">Fiyatlandırma</a>
          <a href="#faq" className="hover:text-white transition-colors">SSS</a>
          <Link href="/iletisim" className="hover:text-white transition-colors">İletişim</Link>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/login" className="hidden sm:inline text-sm text-slate-300 hover:text-white">Giriş</Link>
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
      logo: 'https://www.ekatalox.com/ekatalox-logo.png',
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
    <main id="top" className="relative bg-[#0B0F19] text-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <Navbar />
      <Hero />
      <ExcelSimulator />
      <StepSection />
      <BentoFeatures />
      <Comparison />
      <DemoSection />
      <AlexWhatsApp />
      <Pricing />
      <FAQ />
      <Waitlist />
      <FinalCTA />
      <Footer />
    </main>
  )
}

export default App
