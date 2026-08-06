'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { EkataloxLogo } from '@/components/brand/ekatalox-logo'

export const SiteNavbar = () => (
  <nav className="fixed top-0 left-0 right-0 z-50">
    <div className="backdrop-blur-xl bg-[#090d16]/70 border-b border-white/5">
      <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
        <Link href="/#top" className="flex items-center gap-2">
          <EkataloxLogo className="h-8 w-[148px]" priority />
        </Link>
        <div className="hidden md:flex items-center gap-7 text-sm text-slate-300">
          <Link href="/temalar" className="hover:text-white transition-colors">Temalar</Link>
          <Link href="/#demo" className="hover:text-white transition-colors">Özellikler</Link>
          <Link href="/musteriler" className="hover:text-white transition-colors">Müşteriler</Link>
          <Link href="/#fiyatlandirma" className="hover:text-white transition-colors">Fiyatlandırma</Link>
          <Link href="/yenilikler" className="hover:text-white transition-colors">Yenilikler</Link>
          <Link href="/iletisim" className="hover:text-white transition-colors">İletişim</Link>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/login" className="hidden sm:inline text-sm text-slate-300 hover:text-white">Giriş</Link>
          <Link href="/kayit" className="px-4 py-1.5 rounded-full bg-white text-black text-sm font-medium hover:scale-105 transition-transform">Ücretsiz Başla</Link>
        </div>
      </div>
    </div>
  </nav>
)

export const SiteFooter = () => (
  <footer className="relative border-t border-white/5 bg-[#090d16]">
    <div className="h-px w-full" style={{ background: 'linear-gradient(90deg, transparent 0%, #10b981 30%, #00ff87 70%, transparent 100%)' }} />
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
            <Link href="/login" className="px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-xl text-xs text-white hover:bg-white/10 transition-colors">Workspace Giriş</Link>
            <Link href="/kayit" className="px-4 py-2 rounded-full bg-white text-black text-xs font-medium hover:scale-105 transition-transform">Ücretsiz Başla</Link>
          </div>
        </div>
        <FooterCol title="Ürün" items={[
          ['Temalar', '/temalar'],
          ['Özellikler', '/#demo'],
          ['Fiyatlandırma', '/#fiyatlandirma'],
          ['Demo', '/#demo'],
          ['Yenilikler', '/yenilikler'],
        ]} />
        <FooterCol title="Şirket" items={[
          ['Hakkımızda', '/hakkimizda'],
          ['Müşteriler', '/musteriler'],
          ['İletişim', '/iletisim'],
          ['Kariyer', '/hakkimizda'],
        ]} />
        <FooterCol title="Destek" items={[
          ['Yardım Merkezi', '/yardim'],
          ['Dokümantasyon', '/yardim'],
          ['API', '/yardim'],
          ['Durum', '/yardim'],
        ]} />
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
          <Link href={href} className="text-sm text-slate-400 hover:text-white transition-colors">{label}</Link>
        </li>
      ))}
    </ul>
  </div>
)

export const PageHero = ({ tag, title, subtitle, children }) => (
  <section className="relative pt-36 md:pt-44 pb-16 md:pb-20 px-6 overflow-hidden">
    <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[900px] h-[600px] rounded-full bg-[#10b981]/15 blur-[160px] pointer-events-none" />
    <div className="absolute top-20 right-0 w-[500px] h-[500px] rounded-full bg-[#00ff87]/15 blur-[140px] pointer-events-none" />
    <div className="relative max-w-5xl mx-auto text-center">
      {tag && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-xl text-xs text-slate-300 mb-6"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-[#10b981] animate-pulse" />
          {tag}
        </motion.div>
      )}
      <motion.h1
        initial={{ opacity: 0, y: 20, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
        className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-white text-balance"
        style={{ letterSpacing: '-0.04em', lineHeight: 1 }}
      >
        {title}
      </motion.h1>
      {subtitle && (
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="mt-6 text-lg md:text-xl text-slate-400 max-w-2xl mx-auto font-light text-balance"
        >
          {subtitle}
        </motion.p>
      )}
      {children}
    </div>
  </section>
)
