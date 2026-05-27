'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Mail, Phone, MapPin, MessageCircle, CheckCircle2, ArrowRight, Building2, Briefcase, HelpCircle } from 'lucide-react'
import { SiteNavbar, SiteFooter, PageHero } from '@/components/site-chrome'

const departments = [
  { icon: Briefcase, name: 'Satış', email: 'satis@ekatalox.com', desc: 'Demo talebi, kurumsal teklif' },
  { icon: HelpCircle, name: 'Destek', email: 'destek@ekatalox.com', desc: 'Teknik destek, sorun bildirimi' },
  { icon: Building2, name: 'Kurumsal', email: 'kurumsal@ekatalox.com', desc: 'Anlaşma, ortaklık, basın' },
]

const Page = () => {
  const [form, setForm] = useState({ name: '', company: '', email: '', phone: '', subject: 'demo', message: '' })
  const [sent, setSent] = useState(false)
  const [sending, setSending] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [apiError, setApiError] = useState('')

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm({ ...form, [k]: e.target.value })

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    const errs: Record<string, string> = {}
    if (!form.name.trim()) errs.name = 'Adınızı girin'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = 'Geçerli e-posta girin'
    if (form.message.trim().length < 10) errs.message = 'En az 10 karakter yazın'
    setErrors(errs)
    if (Object.keys(errs).length > 0) return

    setSending(true)
    setApiError('')
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) throw new Error('Gönderim başarısız')
      setSent(true)
    } catch {
      setApiError('Mesaj gönderilemedi. Lütfen tekrar deneyin veya info@ekatalox.com adresine yazın.')
    } finally {
      setSending(false)
    }
  }

  return (
    <main className="relative min-h-screen bg-[#0B0F19] text-white overflow-hidden">
      <SiteNavbar />
      <PageHero
        tag="İletişim"
        title={<>Bizimle <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#00D2FF] to-[#7928CA]">konuşalım.</span></>}
        subtitle="Demo, fiyat teklifi veya genel bir soru — her türlü konuda 24 saat içinde geri dönüş sağlıyoruz."
      />

      <section className="relative pb-32 px-6">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-[1fr_1.2fr] gap-10">
          <div className="space-y-6">
            {departments.map((d, i) => (
              <motion.div key={d.name} initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: false, amount: 0.3 }} transition={{ duration: 0.6, delay: i * 0.1 }}
                className="flex items-start gap-4 p-5 rounded-2xl border border-white/10 bg-white/[0.02] hover:border-white/20 transition-colors">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#00D2FF]/20 to-[#7928CA]/20 border border-white/10 flex items-center justify-center flex-shrink-0">
                  <d.icon className="w-5 h-5 text-[#00D2FF]" />
                </div>
                <div>
                  <div className="text-base text-white font-semibold">{d.name}</div>
                  <div className="text-xs text-slate-500 mt-0.5">{d.desc}</div>
                  <a href={`mailto:${d.email}`} className="text-sm text-[#00D2FF] hover:text-white transition-colors mt-2 inline-flex items-center gap-1">
                    {d.email} <ArrowRight className="w-3 h-3" />
                  </a>
                </div>
              </motion.div>
            ))}

            <div className="pt-6 grid grid-cols-2 gap-4">
              <InfoTile icon={Phone} label="Telefon" value="+90 535 417 25 10" />
              <InfoTile icon={Mail} label="Genel" value="info@ekatalox.com" />
              <InfoTile icon={MessageCircle} label="Canlı Destek" value="Hafta içi 09:00 - 18:00" />
              <InfoTile icon={MapPin} label="Merkez" value="Levent, İstanbul" />
            </div>
          </div>

          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: false, amount: 0.2 }} transition={{ duration: 0.8 }}
            className="relative rounded-3xl border border-white/10 bg-gradient-to-b from-white/[0.04] to-white/[0.01] p-7 md:p-9 overflow-hidden">
            <div className="absolute -top-20 -right-20 w-60 h-60 rounded-full bg-[#00D2FF]/15 blur-3xl pointer-events-none" />
            <AnimatePresence mode="wait">
              {!sent ? (
                <motion.form key="form" onSubmit={submit} noValidate initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="relative space-y-4">
                  <h2 className="text-2xl md:text-3xl font-semibold">Mesaj gönderin</h2>
                  <p className="text-sm text-slate-400">Formu doldurun, ekibimiz 24 saat içinde dönüş sağlasın.</p>
                  <div className="grid sm:grid-cols-2 gap-4 pt-2">
                    <FormField label="Ad Soyad" placeholder="Ahmet Yılmaz" value={form.name} onChange={set('name')} error={errors.name} />
                    <FormField label="Şirket" placeholder="Toptan A.Ş." value={form.company} onChange={set('company')} />
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <FormField label="E-posta" type="email" placeholder="isim@firmaniz.com" value={form.email} onChange={set('email')} error={errors.email} />
                    <FormField label="Telefon" placeholder="+90 …" value={form.phone} onChange={set('phone')} />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 mb-1.5 block uppercase tracking-wider">Konu</label>
                    <select value={form.subject} onChange={set('subject')} className="w-full px-4 py-3 rounded-xl bg-black/30 border border-white/10 text-sm text-white outline-none focus:border-[#00D2FF]/60">
                      <option value="demo">Demo Talep Etmek İstiyorum</option>
                      <option value="satis">Satış / Fiyat Teklifi</option>
                      <option value="destek">Teknik Destek</option>
                      <option value="ortaklik">Ortaklık / Anlaşma</option>
                      <option value="diger">Diğer</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 mb-1.5 block uppercase tracking-wider">Mesajınız</label>
                    <textarea rows={5} placeholder="Bize biraz daha bahsedin…" value={form.message} onChange={set('message')}
                      className={`w-full px-4 py-3 rounded-xl bg-black/30 border text-sm text-white placeholder:text-slate-600 outline-none transition-colors resize-none ${
                        errors.message ? 'border-red-500/60' : 'border-white/10 focus:border-[#00D2FF]/60'
                      }`} />
                    {errors.message && <div className="mt-1 text-[11px] text-red-400">{errors.message}</div>}
                  </div>
                  {apiError && <div className="text-sm text-red-400 text-center">{apiError}</div>}
                  <button type="submit" disabled={sending} className="w-full mt-2 inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full bg-white text-black font-medium text-sm hover:scale-[1.01] transition-transform disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100">
                    {sending ? 'Gönderiliyor…' : <><span>Mesajı Gönder</span><ArrowRight className="w-4 h-4" /></>}
                  </button>
                </motion.form>
              ) : (
                <motion.div key="sent" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="relative text-center py-10">
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 200, damping: 14, delay: 0.1 }}
                    className="mx-auto w-20 h-20 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-400 flex items-center justify-center shadow-[0_0_60px_rgba(16,185,129,0.5)]">
                    <CheckCircle2 className="w-10 h-10 text-white" strokeWidth={2.5} />
                  </motion.div>
                  <h3 className="mt-6 text-2xl font-semibold">Mesajınız alındı!</h3>
                  <p className="mt-2 text-slate-400 max-w-sm mx-auto">{form.name.split(' ')[0]}, 24 saat içinde <span className="text-white">{form.email}</span> adresine dönüş sağlayacağız.</p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </section>

      <SiteFooter />
    </main>
  )
}

const InfoTile = ({ icon: Icon, label, value }) => (
  <div className="p-4 rounded-xl border border-white/10 bg-white/[0.02]">
    <Icon className="w-4 h-4 text-[#00D2FF]" />
    <div className="mt-2 text-[10px] uppercase tracking-widest text-slate-500">{label}</div>
    <div className="text-sm text-white mt-0.5">{value}</div>
  </div>
)

const FormField = ({ label, type = 'text', placeholder, value, onChange, error }) => (
  <div>
    <label className="text-xs text-slate-400 mb-1.5 block uppercase tracking-wider">{label}</label>
    <input type={type} placeholder={placeholder} value={value} onChange={onChange}
      className={`w-full px-4 py-3 rounded-xl bg-black/30 border text-sm text-white placeholder:text-slate-600 outline-none transition-colors ${error ? 'border-red-500/60' : 'border-white/10 focus:border-[#00D2FF]/60'}`} />
    {error && <div className="mt-1 text-[11px] text-red-400">{error}</div>}
  </div>
)

export default Page
