"use client";

// Kayıt sihirbazı (21 Eyl 2026): 3 kısa adım + kurulum ekranı, üstte
// ilerleme çubuğu (components/marketing/signup-stepper.tsx).
//   1 İşletme bilgileri  → ad, sektör, katalog adresi (canlı kontrol)
//   2 WhatsApp           → sipariş numarası (telefon olarak da kaydedilir)
//   3 Giriş bilgileri    → ad soyad, il, e-posta, şifre, paket, şartlar
//   4 Kataloğunuz hazır  → kuruluyor… / başarı ekranı
// POST /api/signup sözleşmesi değişmedi:
// {businessName, sector, fullName, phone, email, password, city, district,
//  neighborhood, address, taxOffice, taxNumber, whatsappNumber, subdomain,
//  plan, termsAccepted:true}
// 201 → {storeUrl, panelUrl, subdomain, requestedPlan}; 400/409 → {error, field?}
// Adres/vergi alanları sihirbazda sorulmaz (boş gider; fatura aşamasında
// eklenir). Hesap her zaman Ücretsiz açılır; ücretli paket seçimi taleptir.
import Link from "next/link";
import { ArrowLeft, Eye, EyeOff, Loader2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { trackMetaEvent } from "@/lib/marketing/meta-pixel";
import {
  formatTry,
  getToptanPlan,
  isToptanPlanSlug,
  TOPTAN_PLANS,
  TOPTAN_SECTOR_OPTIONS,
  type ToptanPlanSlug,
} from "@/lib/billing/toptan-plans";
import { SITE } from "@/lib/marketing/site";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Field, FormAlert, fieldInputClass } from "@/components/marketing/form-field";
import { PhoneFrame } from "@/components/marketing/phone-frame";
import { SignupStepper, type SignupStepIndex } from "@/components/marketing/signup-stepper";
import { cn } from "@/lib/utils";

type FormState = {
  businessName: string;
  sector: string;
  subdomain: string;
  whatsappNumber: string;
  fullName: string;
  city: string;
  email: string;
  password: string;
  termsAccepted: boolean;
};

type Errors = Partial<Record<keyof FormState | "form", string>>;

type SubdomainState =
  | { status: "idle" }
  | { status: "checking" }
  | { status: "available"; message?: string }
  | { status: "taken"; message?: string; suggestion?: string }
  | { status: "error"; message: string };

type Success = { storeUrl: string; panelUrl: string; subdomain: string; requestedPlan: string };

const PHONE_RE = /^05\d{9}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SUBDOMAIN_RE = /^[a-z0-9](?:[a-z0-9-]{1,61}[a-z0-9])?$/;

const TR_MAP: Record<string, string> = { ç: "c", ğ: "g", ı: "i", ö: "o", ş: "s", ü: "u", Ç: "c", Ğ: "g", I: "i", İ: "i", Ö: "o", Ş: "s", Ü: "u" };

/** İşletme adından Türkçe-güvenli alt alan adı: ç→c, ğ→g, ı→i, ö→o, ş→s, ü→u; [a-z0-9-]. */
export function toSubdomain(value: string) {
  return value
    .replace(/[çğıöşüÇĞIİÖŞÜ]/g, (ch) => TR_MAP[ch] ?? ch)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-")
    .slice(0, 63);
}

function normalizePhone(value: string) {
  return value.replace(/[\s()-]/g, "");
}

/** Sunucudan dönen alan hatası hangi adımda gösterilecek. API'nin eski
 *  alan adları (phone, adres/vergi) da ilgili adıma eşlenir. */
const FIELD_STEP: Record<string, SignupStepIndex> = {
  businessName: 0,
  sector: 0,
  subdomain: 0,
  whatsappNumber: 1,
  phone: 1,
  fullName: 2,
  city: 2,
  district: 2,
  neighborhood: 2,
  address: 2,
  taxOffice: 2,
  taxNumber: 2,
  email: 2,
  password: 2,
  plan: 2,
  termsAccepted: 2,
};

const STEP_VISUAL: Record<0 | 1 | 2, { src: string; alt: string; caption: string }> = {
  0: { src: "/site/toptan-katalog.png", alt: "Demo toptan kataloğunun ürün listesi", caption: "Bayileriniz kataloğu telefondan böyle görür" },
  1: { src: "/site/toptan-sepet.png", alt: "Demo katalogda dolu sepet ve WhatsApp ile gönder tuşu", caption: "Sepet WhatsApp'a sipariş fişi olarak düşer" },
  2: { src: "/site/toptan-giris.png", alt: "Demo kataloğun bayi şifre giriş ekranı", caption: "Fiyatlar yalnız şifre verdiğiniz bayilere açılır" },
};

export function SignupForm({ initialPlan, initialSector }: { initialPlan?: string; initialSector?: string }) {
  const [plan, setPlan] = useState<ToptanPlanSlug>(isToptanPlanSlug(initialPlan) ? initialPlan : "free");
  const sectorValid = TOPTAN_SECTOR_OPTIONS.some((o) => o.value === initialSector);

  const [form, setForm] = useState<FormState>({
    businessName: "",
    sector: sectorValid && initialSector ? initialSector : "",
    subdomain: "",
    whatsappNumber: "",
    fullName: "",
    city: "",
    email: "",
    password: "",
    termsAccepted: false,
  });
  const [step, setStep] = useState<SignupStepIndex>(0);
  const [errors, setErrors] = useState<Errors>({});
  const [subdomainTouched, setSubdomainTouched] = useState(false);
  const [subdomainState, setSubdomainState] = useState<SubdomainState>({ status: "idle" });
  const [showPassword, setShowPassword] = useState(false);
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState<Success | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const topRef = useRef<HTMLDivElement>(null);

  const selectedPlan = getToptanPlan(plan) ?? TOPTAN_PLANS[0];
  const paidRequested = selectedPlan.yearlyPrice > 0;

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => (e[key] || e.form ? { ...e, [key]: undefined, form: undefined } : e));
  }

  // İşletme adı → alt alan adı (kullanıcı elle değiştirene kadar).
  function onBusinessName(value: string) {
    update("businessName", value);
    if (!subdomainTouched) {
      const derived = toSubdomain(value);
      setForm((f) => ({ ...f, businessName: value, subdomain: derived }));
    }
  }

  // Alt alan adı canlı kontrolü: 450 ms bekleme, sonuncu istek kazanır.
  const subdomain = form.subdomain;
  useEffect(() => {
    if (!subdomain || subdomain.length < 3 || !SUBDOMAIN_RE.test(subdomain)) {
      const idle = setTimeout(() => setSubdomainState({ status: "idle" }), 0);
      return () => clearTimeout(idle);
    }
    let cancelled = false;
    const t = setTimeout(async () => {
      setSubdomainState({ status: "checking" });
      try {
        const res = await fetch(`/api/signup/check-subdomain?value=${encodeURIComponent(subdomain)}`, {
          headers: { Accept: "application/json" },
        });
        const data = (await res.json().catch(() => null)) as { available?: boolean; suggestion?: string; message?: string } | null;
        if (cancelled) return;
        if (!res.ok || !data || typeof data.available !== "boolean") {
          setSubdomainState({ status: "error", message: data?.message ?? "Adres şu an kontrol edilemedi." });
          return;
        }
        setSubdomainState(
          data.available
            ? { status: "available", message: data.message }
            : { status: "taken", message: data.message, suggestion: data.suggestion },
        );
      } catch {
        if (!cancelled) setSubdomainState({ status: "error", message: "Bağlantı kurulamadı; gönderirken tekrar kontrol edeceğiz." });
      }
    }, 450);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [subdomain]);

  function validateStep(s: SignupStepIndex): Errors {
    const e: Errors = {};
    if (s === 0) {
      if (form.businessName.trim().length < 2) e.businessName = "İşletme adını yazın.";
      if (!form.sector) e.sector = "Sektörünüzü seçin.";
      if (form.subdomain.length < 3 || !SUBDOMAIN_RE.test(form.subdomain))
        e.subdomain = "En az 3 karakter; yalnız küçük harf, rakam ve tire.";
      else if (subdomainState.status === "taken") e.subdomain = "Bu adres alınmış; başka bir ad deneyin.";
    } else if (s === 1) {
      if (!PHONE_RE.test(normalizePhone(form.whatsappNumber)))
        e.whatsappNumber = "05 ile başlayan 11 haneli numara yazın (örn. 0532 000 00 00).";
    } else if (s === 2) {
      if (form.fullName.trim().length < 3) e.fullName = "Ad ve soyadınızı yazın.";
      if (!form.city.trim()) e.city = "İl yazın.";
      if (!EMAIL_RE.test(form.email.trim())) e.email = "Geçerli bir e-posta adresi yazın.";
      if (form.password.length < 8) e.password = "Şifre en az 8 karakter olmalı.";
      if (!form.termsAccepted) e.termsAccepted = "Devam etmek için şartları kabul etmelisiniz.";
    }
    return e;
  }

  function focusFirstError(e: Errors) {
    const first = Object.keys(e).find((k) => k !== "form");
    if (!first) return;
    const el = formRef.current?.querySelector<HTMLElement>(`[name="${first}"]`);
    el?.focus();
    el?.scrollIntoView({ block: "center" });
  }

  function scrollToTop() {
    requestAnimationFrame(() => topRef.current?.scrollIntoView({ block: "start", behavior: "smooth" }));
  }

  function goTo(nextStep: SignupStepIndex) {
    setStep(nextStep);
    setErrors({});
    scrollToTop();
  }

  function next() {
    const e = validateStep(step);
    setErrors(e);
    if (Object.keys(e).length) {
      requestAnimationFrame(() => focusFirstError(e));
      return;
    }
    if (step < 2) goTo((step + 1) as SignupStepIndex);
  }

  async function submit(ev: React.FormEvent) {
    ev.preventDefault();
    if (step < 2) {
      next();
      return;
    }
    const e = validateStep(2);
    setErrors(e);
    if (Object.keys(e).length) {
      requestAnimationFrame(() => focusFirstError(e));
      return;
    }
    setSending(true);
    goTo(3);
    const phone = normalizePhone(form.whatsappNumber);
    try {
      const res = await fetch("/api/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          businessName: form.businessName.trim(),
          sector: form.sector,
          fullName: form.fullName.trim(),
          phone,
          email: form.email.trim().toLowerCase(),
          password: form.password,
          city: form.city.trim(),
          district: "",
          neighborhood: "",
          address: "",
          taxOffice: "",
          taxNumber: "",
          whatsappNumber: phone,
          subdomain: form.subdomain,
          plan,
          termsAccepted: true,
        }),
      });
      const data = (await res.json().catch(() => null)) as (Partial<Success> & { error?: string; field?: string }) | null;
      if (res.status === 201 && data?.storeUrl && data.panelUrl && data.subdomain) {
        setSuccess({ storeUrl: data.storeUrl, panelUrl: data.panelUrl, subdomain: data.subdomain, requestedPlan: data.requestedPlan ?? plan });
        trackMetaEvent("CompleteRegistration", { content_name: data.requestedPlan ?? plan });
        return;
      }
      // Hata: ilgili adıma dön, alanı işaretle.
      const message = data?.error ?? "Başvuru gönderilemedi. Lütfen tekrar deneyin.";
      const serverField = data?.field ?? "";
      const targetStep = serverField in FIELD_STEP ? FIELD_STEP[serverField] : 2;
      const field: keyof Errors = serverField in form ? (serverField as keyof FormState) : serverField === "phone" ? "whatsappNumber" : "form";
      const nextErrors: Errors = { [field]: message };
      setStep(targetStep);
      setErrors(nextErrors);
      requestAnimationFrame(() => {
        topRef.current?.scrollIntoView({ block: "start", behavior: "smooth" });
        if (field !== "form") focusFirstError(nextErrors);
      });
    } catch {
      setStep(2);
      setErrors({ form: `Bağlantı kurulamadı. İnternetinizi kontrol edin ya da ${SITE.phone} numarasını arayın.` });
      scrollToTop();
    } finally {
      setSending(false);
    }
  }

  const visual = step < 3 ? STEP_VISUAL[step as 0 | 1 | 2] : null;

  return (
    <div ref={topRef} className="scroll-mt-24">
      <div className="mx-auto max-w-3xl">
        <SignupStepper current={step} onSelect={step < 3 && !sending ? goTo : undefined} />
      </div>

      <div className="mt-12 grid gap-10 lg:mt-16 lg:grid-cols-[1fr_1.4fr] lg:items-start lg:gap-16">
        {/* Sol: adıma göre gerçek ekran görüntüsü (masaüstü) */}
        {visual ? (
          <div className="hidden lg:block">
            <PhoneFrame src={visual.src} alt={visual.alt} className="w-[280px] sm:w-[280px]" />
            <p className="mt-4 text-center text-sm text-brand-muted">{visual.caption}</p>
          </div>
        ) : null}

        <form ref={formRef} onSubmit={submit} noValidate className={cn(!visual && "lg:col-span-2")}>
          {step === 0 ? (
            <StepPanel title="İşletmenizi tanıtın" description="Katalogda görünecek firma adı ve katalog adresiniz.">
              {errors.form ? <FormAlert tone="error">{errors.form}</FormAlert> : null}
              <Field id="businessName" label="İşletme adı" error={errors.businessName}>
                <Input
                  id="businessName"
                  name="businessName"
                  value={form.businessName}
                  onChange={(e) => onBusinessName(e.target.value)}
                  placeholder="Örn. Yıldız Toptan"
                  autoComplete="organization"
                  autoFocus
                  aria-invalid={Boolean(errors.businessName)}
                  className={fieldInputClass}
                />
              </Field>
              <Field id="sector" label="Sektör" error={errors.sector}>
                <Select
                  id="sector"
                  name="sector"
                  value={form.sector}
                  onChange={(e) => update("sector", e.target.value)}
                  aria-invalid={Boolean(errors.sector)}
                  className={cn(fieldInputClass, "text-[16px]")}
                >
                  <option value="">Seçin</option>
                  {TOPTAN_SECTOR_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field id="subdomain" label="Katalog adresi" error={errors.subdomain} hint={subdomainHint(subdomainState, form.subdomain)}>
                <div className="flex items-stretch">
                  <div className="relative flex-1">
                    <Input
                      id="subdomain"
                      name="subdomain"
                      value={form.subdomain}
                      onChange={(e) => {
                        setSubdomainTouched(true);
                        update("subdomain", toSubdomain(e.target.value));
                      }}
                      placeholder="yildiztoptan"
                      autoComplete="off"
                      spellCheck={false}
                      aria-invalid={Boolean(errors.subdomain)}
                      className={cn(
                        fieldInputClass,
                        "rounded-r-none pr-9 font-plex-mono",
                        subdomainState.status === "available" && "border-brand-green",
                        subdomainState.status === "taken" && "border-red-600",
                      )}
                    />
                    <SubdomainBadge state={subdomainState} />
                  </div>
                  <span className="inline-flex items-center rounded-r-lg border border-l-0 border-brand-line bg-brand-paper px-3 font-plex-mono text-sm text-brand-muted">
                    .ekatalox.com
                  </span>
                </div>
                {subdomainState.status === "taken" && subdomainState.suggestion ? (
                  <button
                    type="button"
                    onClick={() => {
                      setSubdomainTouched(true);
                      update("subdomain", toSubdomain(subdomainState.suggestion ?? ""));
                    }}
                    className="mt-2 text-sm font-semibold text-brand-navy underline underline-offset-4"
                  >
                    Öneri: {subdomainState.suggestion}
                  </button>
                ) : null}
              </Field>
              <StepActions primary="Onayla ve devam et" />
            </StepPanel>
          ) : null}

          {step === 1 ? (
            <StepPanel
              title="Siparişler nereye gelsin?"
              description="Bayileriniz sepeti gönderince sipariş fişi bu WhatsApp numarasına düşer. Sizinle de bu numaradan iletişim kurarız."
            >
              {errors.form ? <FormAlert tone="error">{errors.form}</FormAlert> : null}
              <Field id="whatsappNumber" label="WhatsApp sipariş numarası" error={errors.whatsappNumber} hint="05xx ile başlayan cep numarası.">
                <Input
                  id="whatsappNumber"
                  name="whatsappNumber"
                  type="tel"
                  inputMode="tel"
                  value={form.whatsappNumber}
                  onChange={(e) => update("whatsappNumber", e.target.value)}
                  placeholder="0532 000 00 00"
                  autoComplete="tel-national"
                  autoFocus
                  aria-invalid={Boolean(errors.whatsappNumber)}
                  className={cn(fieldInputClass, "font-plex-mono text-lg tabular-nums")}
                />
              </Field>
              <StepActions primary="Numarayı onayla ve devam et" onBack={() => goTo(0)} />
            </StepPanel>
          ) : null}

          {step === 2 ? (
            <StepPanel title="Biraz sizi tanıyalım" description="Panele e-posta ve şifrenizle girersiniz. Kart bilgisi istenmez.">
              {errors.form ? <FormAlert tone="error">{errors.form}</FormAlert> : null}
              <div className="grid gap-5 sm:grid-cols-[1.4fr_1fr]">
                <Field id="fullName" label="Adınız soyadınız" error={errors.fullName}>
                  <Input
                    id="fullName"
                    name="fullName"
                    value={form.fullName}
                    onChange={(e) => update("fullName", e.target.value)}
                    autoComplete="name"
                    autoFocus
                    aria-invalid={Boolean(errors.fullName)}
                    className={fieldInputClass}
                  />
                </Field>
                <Field id="city" label="İl" error={errors.city}>
                  <Input
                    id="city"
                    name="city"
                    value={form.city}
                    onChange={(e) => update("city", e.target.value)}
                    placeholder="İstanbul"
                    autoComplete="address-level1"
                    aria-invalid={Boolean(errors.city)}
                    className={fieldInputClass}
                  />
                </Field>
              </div>
              <Field id="email" label="E-posta (giriş adresi)" error={errors.email}>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  inputMode="email"
                  value={form.email}
                  onChange={(e) => update("email", e.target.value)}
                  autoComplete="email"
                  aria-invalid={Boolean(errors.email)}
                  className={fieldInputClass}
                />
              </Field>
              <Field id="password" label="Giriş şifreniz" error={errors.password} hint="En az 8 karakter.">
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    value={form.password}
                    onChange={(e) => update("password", e.target.value)}
                    autoComplete="new-password"
                    aria-invalid={Boolean(errors.password)}
                    className={cn(fieldInputClass, "pr-11")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? "Şifreyi gizle" : "Şifreyi göster"}
                    className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-brand-muted hover:text-brand-navy"
                  >
                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </Field>

              {/* Paket: hesap Ücretsiz açılır, ücretli seçim talep olarak gider */}
              <fieldset>
                <legend className="text-sm font-semibold text-brand-ink">Paket</legend>
                <p className="mt-1 text-sm text-brand-muted">
                  Hesabınız hemen Ücretsiz açılır. Ücretli paket seçerseniz temsilcimiz arar; ödemeye kadar ücretsiz kullanırsınız.
                </p>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  {TOPTAN_PLANS.map((p) => {
                    const checked = plan === p.slug;
                    const isFree = p.yearlyPrice === 0;
                    return (
                      <label
                        key={p.slug}
                        className={cn(
                          "flex cursor-pointer items-start gap-2.5 rounded-lg border bg-white px-3 py-2.5",
                          checked ? "border-2 border-brand-green" : "border-brand-line",
                        )}
                      >
                        <input type="radio" name="plan" value={p.slug} checked={checked} onChange={() => setPlan(p.slug)} className="mt-1 size-4 accent-brand-green" />
                        <span className="min-w-0 flex-1">
                          <span className="flex items-baseline justify-between gap-2">
                            <span className="text-sm font-bold text-brand-navy">{p.name}</span>
                            <span className="font-plex-mono text-xs tabular-nums text-brand-navy">{isFree ? "0 ₺" : `${formatTry(p.yearlyPrice)}/yıl`}</span>
                          </span>
                          <span className="mt-0.5 block text-xs text-brand-muted">
                            {p.productLimit.toLocaleString("tr-TR")} ürün · {isFree ? "eKatalox reklamlı" : "reklamsız"}
                          </span>
                        </span>
                      </label>
                    );
                  })}
                </div>
                {paidRequested ? (
                  <p className="mt-2 text-xs text-brand-muted">
                    {`${selectedPlan.name}: ${formatTry(selectedPlan.yearlyPrice)} / yıl, KDV hariç. Ödeme havale/EFT ya da temsilci aracılığıyla kart.`}
                  </p>
                ) : null}
              </fieldset>

              <div>
                <label className="flex items-start gap-3 text-sm leading-relaxed">
                  <input
                    type="checkbox"
                    name="termsAccepted"
                    checked={form.termsAccepted}
                    onChange={(e) => update("termsAccepted", e.target.checked)}
                    aria-invalid={Boolean(errors.termsAccepted)}
                    className="mt-1 size-4 accent-brand-green"
                  />
                  <span>
                    <Link href="/kullanim-sartlari" target="_blank" className="font-semibold text-brand-navy underline underline-offset-4">
                      Kullanım şartlarını
                    </Link>{" "}
                    ve{" "}
                    <Link href="/gizlilik-ve-kvkk" target="_blank" className="font-semibold text-brand-navy underline underline-offset-4">
                      Gizlilik ve KVKK metnini
                    </Link>{" "}
                    okudum, kabul ediyorum.
                  </span>
                </label>
                {errors.termsAccepted ? (
                  <p className="mt-1.5 text-sm text-red-700" role="alert">
                    {errors.termsAccepted}
                  </p>
                ) : null}
              </div>

              <StepActions primary="Kurulumu tamamla" onBack={() => goTo(1)} />
            </StepPanel>
          ) : null}

          {step === 3 ? (
            success ? (
              <SuccessScreen data={success} email={form.email} />
            ) : (
              <div className="flex flex-col items-center py-16 text-center" role="status" aria-live="polite">
                <Loader2 className="size-10 animate-spin text-brand-green" />
                <h2 className="mt-6 text-2xl font-bold tracking-[-0.02em] text-brand-navy">Kataloğunuz kuruluyor</h2>
                <p className="mt-2 max-w-sm text-base text-brand-muted">
                  {`${form.subdomain}.ekatalox.com adresi açılıyor, giriş bilgileri hazırlanıyor. Birkaç saniye sürer.`}
                </p>
              </div>
            )
          ) : null}
        </form>
      </div>
    </div>
  );
}

function StepPanel({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return (
    <div className="space-y-6">
      <div className="border-b border-brand-line pb-4">
        <h2 className="text-3xl font-bold tracking-[-0.02em] text-brand-navy">{title}</h2>
        <p className="mt-2 text-base leading-relaxed text-brand-muted">{description}</p>
      </div>
      {children}
    </div>
  );
}

function StepActions({ primary, onBack }: { primary: string; onBack?: () => void }) {
  return (
    <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:items-center">
      {onBack ? (
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center justify-center gap-1.5 rounded-full px-4 py-3 text-sm font-semibold text-brand-muted hover:text-brand-navy"
        >
          <ArrowLeft className="size-4" /> Geri
        </button>
      ) : null}
      <button
        type="submit"
        className="inline-flex items-center justify-center rounded-full bg-brand-green px-7 py-3.5 text-base font-semibold text-white hover:bg-[#126A4F] sm:ml-auto"
      >
        {primary}
      </button>
    </div>
  );
}

function SubdomainBadge({ state }: { state: SubdomainState }) {
  if (state.status === "checking") {
    return <Loader2 className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 animate-spin text-brand-muted" aria-hidden />;
  }
  if (state.status === "available") {
    return (
      <span aria-hidden className="pointer-events-none absolute right-3 top-1/2 flex size-5 -translate-y-1/2 items-center justify-center rounded-full bg-brand-green text-white">
        <svg viewBox="0 0 16 16" className="size-3" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 8.5l3 3 7-7" />
        </svg>
      </span>
    );
  }
  return null;
}

function subdomainHint(state: SubdomainState, value: string) {
  if (!value) return "İşletme adından kendiliğinden oluşur; isterseniz değiştirin.";
  switch (state.status) {
    case "checking":
      return "Kontrol ediliyor...";
    case "available":
      return state.message ?? `${value}.ekatalox.com adresi uygun.`;
    case "taken":
      return state.message ?? "Bu adres alınmış; başka bir ad deneyin.";
    case "error":
      return state.message;
    default:
      return value.length < 3 ? "En az 3 karakter." : "Yalnız küçük harf, rakam ve tire.";
  }
}

function SuccessScreen({ data, email }: { data: Success; email: string }) {
  const requested = getToptanPlan(data.requestedPlan);
  const paidRequested = Boolean(requested && requested.yearlyPrice > 0);
  return (
    <div className="mx-auto max-w-2xl">
      <FormAlert tone="success">Kaydınız tamamlandı, kataloğunuz açıldı.</FormAlert>
      <h2 className="mt-6 text-3xl font-bold tracking-[-0.02em] text-brand-navy">Kataloğunuz hazır</h2>
      <p className="mt-3 text-base leading-relaxed text-brand-muted">
        Giriş bilgileri <span className="font-semibold text-brand-ink">{email}</span> adresine gönderildi. Panele kayıt
        sırasında belirlediğiniz şifreyle girin.
      </p>
      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <a
          href={data.panelUrl}
          className="inline-flex flex-1 items-center justify-center rounded-full bg-brand-green px-6 py-3.5 text-base font-semibold text-white hover:bg-[#126A4F]"
        >
          Yönetim paneline git
        </a>
        <a
          href={data.storeUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex flex-1 items-center justify-center rounded-full border-2 border-brand-navy px-6 py-3.5 text-base font-semibold text-brand-navy hover:bg-brand-paper"
        >
          Kataloğu gör
        </a>
      </div>
      <dl className="mt-6 divide-y divide-brand-line rounded-lg border border-brand-line bg-white">
        <LinkRow label="Katalog adresi" href={data.storeUrl} />
        <LinkRow label="Yönetim paneli" href={data.panelUrl} />
      </dl>
      {paidRequested && requested ? (
        <div className="mt-6 rounded-md border border-brand-line bg-brand-paper px-4 py-3 text-sm leading-relaxed">
          <strong className="text-brand-navy">{requested.name} paketi talebiniz alındı.</strong> Temsilcimiz arayıp ödeme
          bilgisini iletecek; ödeme sonrası paketiniz açılır ve reklamlar kalkar. O zamana kadar Ücretsiz planı
          kullanabilirsiniz.
        </div>
      ) : null}
      <h3 className="mt-8 text-lg font-bold text-brand-navy">Sırada ne var</h3>
      <ol className="mt-3 list-decimal space-y-2 pl-5 text-base leading-relaxed">
        <li>Panele girin, Ürünler bölümünden Excel ile yükleyin. İsterseniz PDF/Excel kataloğunuzu bize gönderin, biz yükleyelim.</li>
        <li>Ayarlar &gt; Şifreler&apos;den bayi şifrenizi belirleyin; adresi ve şifreyi bayilerinize WhatsApp&apos;tan gönderin.</li>
        <li>Bayi sepetini doldurup gönderince sipariş fişi WhatsApp numaranıza PDF olarak düşer.</li>
      </ol>
      <p className="mt-6 text-sm text-brand-muted">
        Yardım için:{" "}
        <a href={SITE.phoneHref} className="font-plex-mono font-semibold text-brand-navy">
          {SITE.phone}
        </a>{" "}
        (WhatsApp da açık).
      </p>
    </div>
  );
}

function LinkRow({ label, href }: { label: string; href: string }) {
  return (
    <div className="flex flex-col gap-1 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <dt className="text-sm text-brand-muted">{label}</dt>
      <dd>
        <a href={href} target="_blank" rel="noopener noreferrer" className="font-plex-mono text-sm font-semibold text-brand-navy underline underline-offset-4">
          {href.replace(/^https?:\/\//, "")}
        </a>
      </dd>
    </div>
  );
}
