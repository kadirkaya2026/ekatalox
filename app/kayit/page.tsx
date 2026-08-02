'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowRight, CheckCircle2, Check, Sparkles, ShieldCheck, Zap } from 'lucide-react'
import { SiteNavbar, SiteFooter } from '@/components/site-chrome'
import {
  formatPlanCapacityDescription,
  NEW_PLAN_OPTIONS,
  PLAN_PRICING,
} from '@/lib/billing/plans'

const plans = NEW_PLAN_OPTIONS.map((option) => ({
  id: option.id,
  name: option.name,
  price: PLAN_PRICING[option.id].price,
  unit: PLAN_PRICING[option.id].unit,
  desc: `${formatPlanCapacityDescription(option.id)}.`,
  featured: option.id === 'business',
}))

const Page = () => {
  const [form, setForm] = useState({ fullName: '', company: '', email: '', phone: '', password: '', plan: 'business' })
  const [submitted, setSubmitted] = useState(false)
  const [sending, setSending] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [apiError, setApiError] = useState('')

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, [k]: e.target.value })

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    const errs: Record<string, string> = {}
    if (!form.fullName.trim()) errs.fullName = 'Adınızı girin'
    if (!form.company.trim()) errs.company = 'Şirket adını girin'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = 'Geçerli bir e-posta girin'
    if (form.password.length < 6) errs.password = 'Şifre en az 6 karakter olmalı'
    setErrors(errs)
    if (Object.keys(errs).length > 0) return

    setSending(true)
    setApiError('')
    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName: form.fullName, company: form.company, email: form.email, phone: form.phone, plan: form.plan }),
      })
      if (!res.ok) throw new Error()
      setSubmitted(true)
    } catch {
      setApiError('Bir hata oluştu. Lütfen tekrar deneyin veya info@ekatalox.com adresine yazın.')
    } finally {
      setSending(false)
    }
  }

  return (
    <main className="relative min-h-screen bg-[#0B0F19] text-white overflow-hidden">
      <SiteNavbar />

      <div className="absolute -top-40 left-1/4 w-[700px] h-[700px] rounded-full bg-[#00D2FF]/15 blur-[160px] pointer-events-none" />
      <div className="absolute top-40 right-0 w-[600px] h-[600px] rounded-full bg-[#7928CA]/20 blur-[160px] pointer-events-none" />

      <div className="relative pt-32 md:pt-36 pb-24 px-6">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-[1.1fr_1fr] gap-12 lg:gap-16 items-start">
          <div className="lg:sticky lg:top-32">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-slate-300 mb-6">
                <Sparkles className="w-3 h-3 text-[#00D2FF]" />
                14 gün ücretsiz · Kart gerekmez
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-balance" style={{ letterSpacing: '-0.04em', lineHeight: 1 }}>
                B2B vitrininizi <br />
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#00D2FF] to-[#7928CA]">5 saniyede</span> kurun.
              </h1>
              <p className="mt-5 text-slate-400 text-base md:text-lg max-w-md font-light">
                Hesabınızı açın, Excel'inizi yükleyin, müşterilerinize hemen profesyonel bir vitrin sunun.
              </p>

              <div className="mt-8 space-y-3">
                {[
                  ['1 Excel ile sınırsız ürün yükleme', 'Anlık vitrin oluşturma'],
                  ['3 seviyeli fiyatlandırma sistemi', 'Bayi / Toptan / Anlaşmalı'],
                  ['Özel subdomain', 'firmaniz.ekatalox.com'],
                  ['7/24 öncelikli destek', 'Ekibimiz yanınızda'],
                ].map(([t, s]) => (
                  <div key={t} className="flex items-start gap-3">
                    <div className="mt-0.5 w-5 h-5 rounded-full bg-[#00D2FF]/15 flex items-center justify-center flex-shrink-0">
                      <Check className="w-3 h-3 text-[#00D2FF]" />
                    </div>
                    <div>
                      <div className="text-sm text-white">{t}</div>
                      <div className="text-xs text-slate-500">{s}</div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-10 pt-8 border-t border-white/5">
                <div className="flex items-center gap-4 text-xs text-slate-500">
                  <div className="flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5" />KVKK uyumlu</div>
                  <div className="flex items-center gap-1.5"><Zap className="w-3.5 h-3.5" />SSL korumalı</div>
                  <div className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5" />ISO 27001</div>
                </div>
              </div>
            </motion.div>
          </div>

          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.1 }} className="relative">
            <div className="relative rounded-3xl border border-white/10 bg-gradient-to-b from-white/[0.04] to-white/[0.01] p-7 md:p-9 backdrop-blur-xl overflow-hidden">
              <div className="absolute -top-20 -right-20 w-60 h-60 rounded-full bg-[#7928CA]/20 blur-3xl pointer-events-none" />
              <AnimatePresence mode="wait">
                {!submitted ? (
                  <motion.form key="form" onSubmit={submit} noValidate initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }} className="relative space-y-5">
                    <div>
                      <h2 className="text-2xl md:text-3xl font-semibold text-white">Hesabınızı oluşturun</h2>
                      <p className="mt-1 text-sm text-slate-400">14 gün ücretsiz · İstediğiniz an iptal edebilirsiniz</p>
                    </div>

                    <Field label="Ad Soyad" placeholder="Ahmet Yılmaz" value={form.fullName} onChange={set('fullName')} error={errors.fullName} />
                    <Field label="Şirket Adı" placeholder="Toptan A.Ş." value={form.company} onChange={set('company')} error={errors.company} />
                    <Field label="Kurumsal E-posta" type="email" placeholder="isim@firmaniz.com" value={form.email} onChange={set('email')} error={errors.email} />
                    <Field label="Telefon" type="tel" placeholder="+90 5XX XXX XX XX" value={form.phone} onChange={set('phone')} />
                    <Field label="Şifre" type="password" placeholder="En az 6 karakter" value={form.password} onChange={set('password')} error={errors.password} />

                    <div>
                      <label className="text-xs text-slate-400 mb-2 block uppercase tracking-wider">Plan seçimi</label>
                      <div className="grid grid-cols-3 gap-2">
                        {plans.map(p => {
                          const selected = form.plan === p.id
                          return (
                            <button key={p.id} type="button" onClick={() => setForm({ ...form, plan: p.id })}
                              className={`relative p-3 rounded-xl border text-left transition-all duration-200 overflow-hidden ${
                                selected
                                  ? 'border-[#00D2FF] ring-1 ring-[#00D2FF]/30 bg-gradient-to-b from-[#00D2FF]/15 to-[#7928CA]/10'
                                  : 'border-white/10 bg-white/[0.02] hover:border-white/20'
                              }`}>
                              {selected && (
                                <span className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-[#00D2FF] to-[#7928CA]" />
                              )}
                              {p.featured && !selected && (
                                <span className="absolute -top-2 left-1/2 -translate-x-1/2 px-1.5 py-0.5 rounded-full bg-gradient-to-r from-[#00D2FF] to-[#7928CA] text-[8px] text-white font-medium uppercase tracking-wider">Popüler</span>
                              )}
                              {selected && (
                                <span className="absolute top-2 right-2">
                                  <Check className="w-3 h-3 text-[#00D2FF]" />
                                </span>
                              )}
                              <div className={`text-[11px] ${selected ? 'text-white' : 'text-slate-400'}`}>{p.name}</div>
                              <div className="text-sm text-white font-semibold mt-1">{p.price}<span className="text-[10px] text-slate-500 font-normal ml-1">{p.unit}</span></div>
                            </button>
                          )
                        })}
                      </div>
                    </div>

                    {apiError && <div className="text-sm text-red-400 text-center">{apiError}</div>}
                    <button type="submit" disabled={sending} className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full bg-white text-black font-medium text-sm hover:scale-[1.01] transition-transform shadow-[0_0_40px_rgba(0,210,255,0.2)] mt-2 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100">
                      {sending ? 'Lütfen bekleyin…' : <><span>Ücretsiz Hesap Aç</span><ArrowRight className="w-4 h-4" /></>}
                    </button>

                    <p className="text-[11px] text-slate-500 text-center">
                      Devam ederek <Link href="/yardim" className="text-slate-300 underline-offset-4 hover:underline">Kullanım Şartları</Link> ve <Link href="/yardim" className="text-slate-300 underline-offset-4 hover:underline">KVKK</Link> metnini kabul etmiş olursunuz.
                    </p>

                    <div className="pt-4 border-t border-white/5 text-center text-sm text-slate-400">
                      Hesabınız var mı? <Link href="/login" className="text-white hover:text-[#00D2FF]">Giriş yapın</Link>
                    </div>
                  </motion.form>
                ) : (
                  <motion.div key="success" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }} className="relative text-center py-8">
                    <motion.div initial={{ scale: 0, rotate: -30 }} animate={{ scale: 1, rotate: 0 }} transition={{ delay: 0.15, type: 'spring', stiffness: 200, damping: 14 }} className="relative mx-auto w-24 h-24 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-400 flex items-center justify-center shadow-[0_0_80px_rgba(16,185,129,0.5)]">
                      <CheckCircle2 className="w-12 h-12 text-white" strokeWidth={2.5} />
                      <motion.div className="absolute inset-0 rounded-full border-2 border-emerald-300" initial={{ scale: 1, opacity: 0.8 }} animate={{ scale: 1.8, opacity: 0 }} transition={{ duration: 1.4, repeat: Infinity }} />
                    </motion.div>
                    <motion.h3 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} className="mt-7 text-2xl md:text-3xl font-semibold text-white">
                      Hoşgeldiniz, {form.fullName.split(' ')[0]}!
                    </motion.h3>
                    <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }} className="mt-3 text-slate-400 max-w-sm mx-auto">
                      Talebiniz alındı. <span className="text-white">{form.email}</span> adresine en kısa sürede dönüş sağlayacağız.
                    </motion.p>
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 }} className="mt-6 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-[11px] text-slate-300">
                      <Sparkles className="w-3 h-3 text-[#00D2FF]" />
                      Workspace URL: <span className="font-mono text-white">{form.company.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') || 'firmaniz'}.ekatalox.com</span>
                    </motion.div>
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }} className="mt-8 flex items-center justify-center gap-3">
                      <Link href="/" className="px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium hover:scale-105 transition-transform">Ana Sayfaya Dön</Link>
                      <Link href="/yardim" className="text-sm text-slate-400 hover:text-white">Yardım Merkezi →</Link>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </div>
      </div>

      <SiteFooter />
    </main>
  )
}

const Field = ({ label, type = 'text', placeholder, value, onChange, error }: {
  label: string; type?: string; placeholder: string; value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; error?: string
}) => (
  <div>
    <label className="text-xs text-slate-400 mb-1.5 block uppercase tracking-wider">{label}</label>
    <input type={type} placeholder={placeholder} value={value} onChange={onChange}
      className={`w-full px-4 py-3 rounded-xl bg-black/30 border text-sm text-white placeholder:text-slate-600 outline-none transition-colors ${
        error ? 'border-red-500/60' : 'border-white/10 focus:border-[#00D2FF]/60'
      }`} />
    {error && <div className="mt-1 text-[11px] text-red-400">{error}</div>}
  </div>
)

export default Page
