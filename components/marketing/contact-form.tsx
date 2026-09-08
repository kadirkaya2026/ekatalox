"use client";

// İletişim formu: mevcut POST /api/contact'a {name, company, email, phone,
// subject, sector, message} gönderir.
import { useState } from "react";
import { SITE } from "@/lib/marketing/site";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Field, FormAlert, fieldInputClass } from "@/components/marketing/form-field";
import { cn } from "@/lib/utils";

const SECTOR_OPTIONS = [
  { value: "market", label: "Market / Bakkal" },
  { value: "tekel", label: "Tekel Bayii" },
  { value: "manav", label: "Manav" },
  { value: "kasap", label: "Kasap / Şarküteri" },
  { value: "cicekci", label: "Çiçekçi" },
  { value: "petshop", label: "Petshop" },
  { value: "kirtasiye", label: "Kırtasiye" },
  { value: "toptanci", label: "Toptancı" },
  { value: "diger", label: "Diğer" },
];

const SUBJECT_OPTIONS = [
  { value: "demo", label: "Demo görmek istiyorum" },
  { value: "satis", label: "Satış / fiyat teklifi" },
  { value: "destek", label: "Teknik destek" },
  { value: "ortaklik", label: "Ortaklık / anlaşma" },
  { value: "diger", label: "Diğer" },
];

type FormState = { name: string; company: string; email: string; phone: string; subject: string; sector: string; message: string };
type Errors = Partial<Record<keyof FormState | "form", string>>;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function ContactForm({ initialSubject = "demo" }: { initialSubject?: string }) {
  const subjectValid = SUBJECT_OPTIONS.some((o) => o.value === initialSubject);
  const [form, setForm] = useState<FormState>({
    name: "",
    company: "",
    email: "",
    phone: "",
    subject: subjectValid ? initialSubject : "demo",
    sector: "",
    message: "",
  });
  const [errors, setErrors] = useState<Errors>({});
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => (e[key] || e.form ? { ...e, [key]: undefined, form: undefined } : e));
  }

  async function submit(ev: React.FormEvent) {
    ev.preventDefault();
    const e: Errors = {};
    if (form.name.trim().length < 3) e.name = "Ad ve soyadınızı yazın.";
    if (!EMAIL_RE.test(form.email.trim())) e.email = "Geçerli bir e-posta adresi yazın.";
    if (!form.sector) e.sector = "İşletme türünüzü seçin.";
    if (form.message.trim().length < 10) e.message = "En az 10 karakter yazın.";
    setErrors(e);
    if (Object.keys(e).length) return;

    setSending(true);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, name: form.name.trim(), email: form.email.trim() }),
      });
      if (!res.ok) throw new Error("contact_failed");
      setSent(true);
    } catch {
      setErrors({ form: `Mesaj gönderilemedi. Tekrar deneyin ya da ${SITE.salesEmail} adresine yazın.` });
    } finally {
      setSending(false);
    }
  }

  if (sent) {
    return (
      <div className="rounded-lg border border-brand-line bg-white p-6 sm:p-8">
        <FormAlert tone="success">Mesajınız alındı.</FormAlert>
        <h2 className="mt-5 text-2xl font-bold text-brand-navy">Teşekkürler, {form.name.trim().split(" ")[0]}.</h2>
        <p className="mt-2 text-base leading-relaxed text-brand-muted">
          Bir iş günü içinde <span className="font-semibold text-brand-ink">{form.email.trim()}</span> adresine dönüş yapacağız. Acil
          ise{" "}
          <a href={SITE.phoneHref} className="font-plex-mono font-semibold text-brand-navy">
            {SITE.phone}
          </a>{" "}
          numarasını arayabilirsiniz.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} noValidate className="rounded-lg border border-brand-line bg-white p-6 sm:p-8">
      <h2 className="text-2xl font-bold text-brand-navy">Mesaj gönderin</h2>
      <p className="mt-1 text-sm text-brand-muted">Bir iş günü içinde dönüş yaparız.</p>
      {errors.form ? <FormAlert tone="error" className="mt-5">{errors.form}</FormAlert> : null}
      <div className="mt-6 grid gap-5 sm:grid-cols-2">
        <Field id="contact-name" label="Ad soyad" error={errors.name}>
          <Input id="contact-name" value={form.name} onChange={(e) => update("name", e.target.value)} autoComplete="name" aria-invalid={Boolean(errors.name)} className={fieldInputClass} />
        </Field>
        <Field id="contact-company" label="İşletme adı" optional>
          <Input id="contact-company" value={form.company} onChange={(e) => update("company", e.target.value)} autoComplete="organization" className={fieldInputClass} />
        </Field>
        <Field id="contact-email" label="E-posta" error={errors.email}>
          <Input id="contact-email" type="email" inputMode="email" value={form.email} onChange={(e) => update("email", e.target.value)} autoComplete="email" aria-invalid={Boolean(errors.email)} className={fieldInputClass} />
        </Field>
        <Field id="contact-phone" label="Telefon" optional>
          <Input id="contact-phone" type="tel" inputMode="tel" value={form.phone} onChange={(e) => update("phone", e.target.value)} autoComplete="tel" placeholder="05xx" className={fieldInputClass} />
        </Field>
        <Field id="contact-sector" label="İşletme türü" error={errors.sector}>
          <Select id="contact-sector" value={form.sector} onChange={(e) => update("sector", e.target.value)} aria-invalid={Boolean(errors.sector)} className={cn(fieldInputClass, "text-[16px]")}>
            <option value="">Seçin</option>
            {SECTOR_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </Select>
        </Field>
        <Field id="contact-subject" label="Konu">
          <Select id="contact-subject" value={form.subject} onChange={(e) => update("subject", e.target.value)} className={cn(fieldInputClass, "text-[16px]")}>
            {SUBJECT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </Select>
        </Field>
        <Field id="contact-message" label="Mesajınız" error={errors.message} className="sm:col-span-2">
          <Textarea id="contact-message" rows={5} value={form.message} onChange={(e) => update("message", e.target.value)} placeholder="Dükkânınızı ve ihtiyacınızı kısaca anlatın." aria-invalid={Boolean(errors.message)} className={fieldInputClass} />
        </Field>
      </div>
      <button
        type="submit"
        disabled={sending}
        className="mt-6 inline-flex w-full items-center justify-center rounded-md bg-brand-green px-6 py-3.5 text-sm font-semibold text-white hover:bg-[#126A4F] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
      >
        {sending ? "Gönderiliyor" : "Mesajı gönder"}
      </button>
    </form>
  );
}
