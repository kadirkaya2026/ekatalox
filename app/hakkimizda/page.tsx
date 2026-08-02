'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { Target, Eye, Heart, Zap, Award, ArrowRight } from 'lucide-react'
import { SiteNavbar, SiteFooter, PageHero } from '@/components/site-chrome'

const values = [
  { icon: Zap, title: 'Hız', desc: '1 dakika standardı. Müşterilerimiz beklemek zorunda kalmaz.' },
  { icon: Target, title: 'Odak', desc: 'Sadece B2B toptancılara odaklıyız. Genel çözüm değiliz.' },
  { icon: Heart, title: 'Sadelik', desc: 'Karmaşıklığı perde arkasına alıyor, sadelikten taviz vermiyoruz.' },
  { icon: Award, title: 'Kalite', desc: 'Apple seviyesinde ürün deneyimi B2B dünyasında artık mümkün.' },
]

const stats = [
  { v: '850+', l: 'Aktif Workspace' },
  { v: '12M+', l: 'Listelenen Ürün' },
  { v: '1dk', l: 'Ortalama Kurulum' },
  { v: '%99.9', l: 'Uptime' },
]

const team = [
  { name: 'Kadir Kaya', role: 'Kurucu · CEO', tag: 'Vizyon' },
  { name: 'Defne Gökalp', role: 'CTO', tag: 'Mühendislik' },
  { name: 'Kerem Özdeğer', role: 'Tasarım Direktörü', tag: 'Deneyim' },
  { name: 'Sevgi Erdoğan', role: 'Müşteri Başarı', tag: 'Destek' },
]

const timeline = [
  ['2025', 'Fikir', 'Toptancılarla yapılan 60+ görüşmede aynı sorun: "Excel\'imi vitrine dönüştüremiyorum."'],
  ['2025 Q4', 'Beta', 'Sessiz beta ile 25 firma. İlk vitrin 1 dakikada yayına alındı.'],
  ['2026 Q1', 'Lansman', 'Halka açık lansman. İlk ay 200+ kayıt.'],
  ['2026', 'Büyüme', "850+ aktif workspace. Türkiye'nin dört bir yanından toptancılar eKatalox kullanıyor."],
]

const Page = () => {
  return (
    <main className="relative min-h-screen bg-[#090d16] text-white overflow-hidden">
      <SiteNavbar />
      <PageHero
        tag="Hakkımızda"
        title={<>Toptancılar için <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#10b981] to-[#00ff87]">sessiz bir devrim.</span></>}
        subtitle="eKatalox, klasik e-ticaretin ağırlığını taşımak istemeyen modern toptancılar için tasarlandı. Bir Excel dosyası kadar sade. Bir Apple ürünü kadar zarif."
      />

      <section className="px-6 pb-24">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-5">
          {[
            { icon: Target, label: 'Misyonumuz', title: 'Her toptancıya 1 dakikada dijital vitrin.', desc: 'Karmaşık panellerle, pahalı ajanslarla, aylar süren projelerle uğraşmadan; her işletmenin dakikalar içinde profesyonel bir B2B vitrine sahip olmasını sağlıyoruz.' },
            { icon: Eye, label: 'Vizyonumuz', title: 'Toptan ticaretin global standardı.', desc: 'Dünya üzerindeki her toptancının ilk tercihi olmak. Bir gün "e-ticaret" demek yerine "katalog" diyebilmek için çalışıyoruz.' },
          ].map((c, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: false, amount: 0.3 }} transition={{ duration: 0.7, delay: i * 0.1 }} className="p-8 rounded-3xl border border-white/10 bg-gradient-to-b from-white/[0.04] to-transparent">
              <c.icon className="w-7 h-7 text-[#10b981]" />
              <div className="mt-4 text-xs uppercase tracking-widest text-slate-500">{c.label}</div>
              <h3 className="mt-2 text-2xl md:text-3xl font-semibold text-white">{c.title}</h3>
              <p className="mt-4 text-slate-400 leading-relaxed">{c.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="px-6 pb-24">
        <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map((s, i) => (
            <motion.div key={s.l} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: false }} transition={{ duration: 0.5, delay: i * 0.08 }} className="p-6 rounded-2xl border border-white/10 bg-white/[0.02] text-center">
              <div className="text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#10b981] to-[#00ff87]">{s.v}</div>
              <div className="text-[11px] text-slate-500 uppercase tracking-widest mt-2">{s.l}</div>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="px-6 pb-24">
        <div className="max-w-6xl mx-auto">
          <motion.h2 initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: false, amount: 0.3 }} className="text-3xl md:text-5xl font-bold tracking-tight text-center" style={{ letterSpacing: '-0.04em' }}>Değerlerimiz</motion.h2>
          <p className="text-center text-slate-400 mt-3 max-w-xl mx-auto">Her satır kodu, her piksel, her kelime; bu dört değere göre yazılır.</p>
          <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {values.map((v, i) => (
              <motion.div key={v.title} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: false, amount: 0.3 }} transition={{ duration: 0.6, delay: i * 0.08 }} whileHover={{ y: -4 }} className="p-6 rounded-2xl border border-white/10 bg-white/[0.02] hover:border-white/20 transition-colors">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#10b981]/20 to-[#00ff87]/20 flex items-center justify-center mb-4">
                  <v.icon className="w-5 h-5 text-[#10b981]" />
                </div>
                <div className="text-lg font-semibold text-white">{v.title}</div>
                <div className="text-sm text-slate-400 mt-2">{v.desc}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 pb-24">
        <div className="max-w-3xl mx-auto">
          <motion.h2 initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: false, amount: 0.3 }} className="text-3xl md:text-5xl font-bold tracking-tight text-center mb-8" style={{ letterSpacing: '-0.04em' }}>Hikayemiz</motion.h2>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false, amount: 0.3 }}
            transition={{ duration: 0.7 }}
            className="relative mb-16 rounded-3xl border border-white/10 bg-gradient-to-b from-white/[0.04] to-transparent p-8 md:p-10"
          >
            <div className="absolute -top-px left-12 right-12 h-px bg-gradient-to-r from-transparent via-[#10b981]/50 to-transparent" />
            <p className="text-sm md:text-base text-slate-300 leading-relaxed">
              eKatalox'un fikri, toptan ticaretin gerçek ve tekrar eden bir sorunundan doğdu. Kurucumuz Kadir Kaya, ailesinin toptan ticaret işinde yıllarca aynı tabloyla karşılaştı: her sezon yeniden hazırlanan yüzlerce sayfalık PDF kataloglar, tek bir fiyat değişikliğinde çöpe giden içerikler, WhatsApp yazışmalarında kaybolan sipariş talepleri.
            </p>
            <p className="mt-4 text-sm md:text-base text-slate-300 leading-relaxed">
              2025'te onlarca toptancıyla yapılan görüşmeler tek bir noktada birleşti: kimse karmaşık bir e-ticaret altyapısı istemiyordu. İhtiyaç netti — Excel'i yükleyip dakikalar içinde profesyonel bir vitrine sahip olabilmek. eKatalox, bu net ihtiyacın doğrudan bir karşılığı olarak kuruldu.
            </p>
          </motion.div>

          <div className="relative space-y-8">
            <div className="absolute left-4 top-2 bottom-2 w-px bg-gradient-to-b from-[#10b981]/40 via-[#00ff87]/40 to-transparent" />
            {timeline.map(([year, label, desc], i) => (
              <motion.div key={year} initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: false, amount: 0.4 }} transition={{ duration: 0.5, delay: i * 0.1 }} className="relative pl-12">
                <div className="absolute left-2 top-1.5 w-5 h-5 rounded-full bg-gradient-to-br from-[#10b981] to-[#00ff87] flex items-center justify-center">
                  <div className="w-1.5 h-1.5 rounded-full bg-white" />
                </div>
                <div className="flex items-baseline gap-3 mb-1">
                  <span className="text-[#10b981] font-mono text-xs tracking-widest">{year}</span>
                  <span className="text-lg font-semibold text-white">{label}</span>
                </div>
                <p className="text-sm text-slate-400 leading-relaxed">{desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 pb-32">
        <div className="max-w-6xl mx-auto">
          <motion.h2 initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: false, amount: 0.3 }} className="text-3xl md:text-5xl font-bold tracking-tight text-center" style={{ letterSpacing: '-0.04em' }}>Takımımız</motion.h2>
          <p className="text-center text-slate-400 mt-3">Toptancıların hayatını kolaylaştıran küçük ama hızlı bir ekip.</p>
          <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-4">
            {team.map((m, i) => (
              <motion.div key={m.name} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: false }} transition={{ delay: i * 0.08 }} className="p-6 rounded-2xl border border-white/10 bg-white/[0.02] text-center hover:border-white/20 transition-colors">
                <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-[#10b981]/30 to-[#00ff87]/30 border border-white/10 flex items-center justify-center text-white text-xl font-semibold">
                  {m.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div className="mt-4 text-white font-semibold text-sm">{m.name}</div>
                <div className="text-xs text-slate-500">{m.role}</div>
                <div className="mt-3 inline-block px-2 py-0.5 rounded-full bg-[#10b981]/10 text-[9px] text-[#10b981] uppercase tracking-widest">{m.tag}</div>
              </motion.div>
            ))}
          </div>
          <div className="mt-12 text-center">
            <Link href="/iletisim" className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white text-black text-sm font-medium hover:scale-105 transition-transform">
              Bizimle çalışmak ister misiniz? <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      <SiteFooter />
    </main>
  )
}

export default Page
