"use client";

// Kayıt formu (20 Eyl 2026 freemium). POST /api/signup sözleşmesi:
// {businessName, sector, fullName, phone, email, password, city, district,
//  neighborhood, address, taxOffice, taxNumber, whatsappNumber, subdomain,
//  plan, termsAccepted:true}
// 201 → {storeUrl, panelUrl, subdomain, requestedPlan}; 400/409 → {error, field?}
// Hesap her zaman Ücretsiz açılır; ücretli paket seçimi satış ekibine talep olarak gider.
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { Field, FormAlert, fieldInputClass } from "@/components/marketing/form-field";
import { cn } from "@/lib/utils";

type FormState = {
  businessName: string;
  sector: string;
  fullName: string;
  phone: string;
  email: string;
  password: string;
  passwordRepeat: string;
  city: string;
  district: string;
  neighborhood: string;
  address: string;
  taxOffice: string;
  taxNumber: string;
  whatsappNumber: string;
  subdomain: string;
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

export function SignupForm({ initialPlan, initialSector }: { initialPlan?: string; initialSector?: string }) {
  const [plan, setPlan] = useState<ToptanPlanSlug>(isToptanPlanSlug(initialPlan) ? initialPlan : "free");
  const sectorValid = TOPTAN_SECTOR_OPTIONS.some((o) => o.value === initialSector);

  const [form, setForm] = useState<FormState>({
    businessName: "",
    sector: sectorValid && initialSector ? initialSector : "",
    fullName: "",
    phone: "",
    email: "",
    password: "",
    passwordRepeat: "",
    city: "",
    district: "",
    neighborhood: "",
    address: "",
    taxOffice: "",
    taxNumber: "",
    whatsappNumber: "",
    subdomain: "",
    termsAccepted: false,
  });
  const [errors, setErrors] = useState<Errors>({});
  const [subdomainTouched, setSubdomainTouched] = useState(false);
  const [whatsappTouched, setWhatsappTouched] = useState(false);
  const [subdomainState, setSubdomainState] = useState<SubdomainState>({ status: "idle" });
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState<Success | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

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

  // Telefon → WhatsApp numarası (kullanıcı elle değiştirene kadar).
  function onPhone(value: string) {
    update("phone", value);
    if (!whatsappTouched) setForm((f) => ({ ...f, phone: value, whatsappNumber: value }));
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

  function validate(): Errors {
    const e: Errors = {};
    if (form.businessName.trim().length < 2) e.businessName = "İşletme adını yazın.";
    if (!form.sector) e.sector = "Sektörünüzü seçin.";
    if (form.fullName.trim().length < 3) e.fullName = "Ad ve soyadınızı yazın.";
    if (!PHONE_RE.test(normalizePhone(form.phone))) e.phone = "05 ile başlayan 11 haneli numara yazın (örn. 0532 000 00 00).";
    if (!EMAIL_RE.test(form.email.trim())) e.email = "Geçerli bir e-posta adresi yazın.";
    if (form.password.length < 8) e.password = "Şifre en az 8 karakter olmalı.";
    if (form.passwordRepeat !== form.password) e.passwordRepeat = "Şifreler aynı değil.";
    if (!form.city.trim()) e.city = "İl yazın.";
    if (!PHONE_RE.test(normalizePhone(form.whatsappNumber))) e.whatsappNumber = "WhatsApp numarası 05 ile başlayan 11 hane olmalı.";
    if (form.subdomain.length < 3 || !SUBDOMAIN_RE.test(form.subdomain))
      e.subdomain = "En az 3 karakter; yalnız küçük harf, rakam ve tire.";
    else if (subdomainState.status === "taken") e.subdomain = "Bu adres alınmış; başka bir ad deneyin.";
    if (!form.termsAccepted) e.termsAccepted = "Devam etmek için şartları kabul etmelisiniz.";
    return e;
  }

  function focusFirstError(e: Errors) {
    const first = Object.keys(e).find((k) => k !== "form");
    if (!first) return;
    const el = formRef.current?.querySelector<HTMLElement>(`[name="${first}"]`);
    el?.focus();
    el?.scrollIntoView({ block: "center" });
  }

  async function submit(ev: React.FormEvent) {
    ev.preventDefault();
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length) {
      focusFirstError(e);
      return;
    }
    setSending(true);
    try {
      const res = await fetch("/api/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          businessName: form.businessName.trim(),
          sector: form.sector,
          fullName: form.fullName.trim(),
          phone: normalizePhone(form.phone),
          email: form.email.trim().toLowerCase(),
          password: form.password,
          city: form.city.trim(),
          district: form.district.trim(),
          neighborhood: form.neighborhood.trim(),
          address: form.address.trim(),
          taxOffice: form.taxOffice.trim(),
          taxNumber: form.taxNumber.trim(),
          whatsappNumber: normalizePhone(form.whatsappNumber),
          subdomain: form.subdomain,
          plan,
          termsAccepted: true,
        }),
      });
      const data = (await res.json().catch(() => null)) as (Partial<Success> & { error?: string; field?: string }) | null;
      if (res.status === 201 && data?.storeUrl && data.panelUrl && data.subdomain) {
        setSuccess({ storeUrl: data.storeUrl, panelUrl: data.panelUrl, subdomain: data.subdomain, requestedPlan: data.requestedPlan ?? plan });
        window.scrollTo({ top: 0 });
        return;
      }
      const message = data?.error ?? "Başvuru gönderilemedi. Lütfen tekrar deneyin.";
      const field = data?.field && data.field in form ? (data.field as keyof FormState) : "form";
      const next: Errors = { [field]: message };
      setErrors(next);
      if (field !== "form") focusFirstError(next);
      else window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      setErrors({ form: `Bağlantı kurulamadı. İnternetinizi kontrol edin ya da ${SITE.phone} numarasını arayın.` });
    } finally {
      setSending(false);
    }
  }

  if (success) return <SuccessScreen data={success} email={form.email} />;


  return (
    <form ref={formRef} onSubmit={submit} noValidate className="grid gap-10 lg:grid-cols-[1.5fr_1fr] lg:items-start">
      <div className="space-y-10">
        {errors.form ? <FormAlert tone="error">{errors.form}</FormAlert> : null}

        {/* 1. İşletme */}
        <Fieldset legend="Firmanız" hint="Katalogda görünecek firma adı ve sektörünüz.">
          <Field id="businessName" label="İşletme adı" error={errors.businessName} className="sm:col-span-2">
            <Input
              id="businessName"
              name="businessName"
              value={form.businessName}
              onChange={(e) => onBusinessName(e.target.value)}
              placeholder="Örn. Yıldız Toptan"
              autoComplete="organization"
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
          <Field
            id="subdomain"
            label="Katalog adresi"
            error={errors.subdomain}
            hint={subdomainHint(subdomainState, form.subdomain)}
          >
            <div className="flex items-stretch">
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
                className={cn(fieldInputClass, "rounded-r-none font-plex-mono")}
              />
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
        </Fieldset>

        {/* 2. Yetkili */}
        <Fieldset legend="Yetkili ve giriş bilgileri" hint="E-posta ve şifre ile panele girersiniz.">
          <Field id="fullName" label="Yetkili ad soyad" error={errors.fullName} className="sm:col-span-2">
            <Input id="fullName" name="fullName" value={form.fullName} onChange={(e) => update("fullName", e.target.value)} autoComplete="name" aria-invalid={Boolean(errors.fullName)} className={fieldInputClass} />
          </Field>
          <Field id="phone" label="Telefon" error={errors.phone} hint="05xx ile başlayan cep numarası.">
            <Input id="phone" name="phone" type="tel" inputMode="tel" value={form.phone} onChange={(e) => onPhone(e.target.value)} placeholder="0532 000 00 00" autoComplete="tel-national" aria-invalid={Boolean(errors.phone)} className={fieldInputClass} />
          </Field>
          <Field id="whatsappNumber" label="WhatsApp sipariş numarası" error={errors.whatsappNumber} hint="Siparişler bu numaraya gelir.">
            <Input
              id="whatsappNumber"
              name="whatsappNumber"
              type="tel"
              inputMode="tel"
              value={form.whatsappNumber}
              onChange={(e) => {
                setWhatsappTouched(true);
                update("whatsappNumber", e.target.value);
              }}
              placeholder="0532 000 00 00"
              aria-invalid={Boolean(errors.whatsappNumber)}
              className={fieldInputClass}
            />
          </Field>
          <Field id="email" label="E-posta (giriş adresi)" error={errors.email} className="sm:col-span-2">
            <Input id="email" name="email" type="email" inputMode="email" value={form.email} onChange={(e) => update("email", e.target.value)} autoComplete="email" aria-invalid={Boolean(errors.email)} className={fieldInputClass} />
          </Field>
          <Field id="password" label="Şifre" error={errors.password} hint="En az 8 karakter.">
            <Input id="password" name="password" type="password" value={form.password} onChange={(e) => update("password", e.target.value)} autoComplete="new-password" aria-invalid={Boolean(errors.password)} className={fieldInputClass} />
          </Field>
          <Field id="passwordRepeat" label="Şifre (tekrar)" error={errors.passwordRepeat}>
            <Input id="passwordRepeat" name="passwordRepeat" type="password" value={form.passwordRepeat} onChange={(e) => update("passwordRepeat", e.target.value)} autoComplete="new-password" aria-invalid={Boolean(errors.passwordRepeat)} className={fieldInputClass} />
          </Field>
        </Fieldset>

        {/* 3. Adres */}
        <Fieldset legend="Firma bilgileri" hint="Yalnız il zorunlu. Adres ve vergi bilgilerini fatura aşamasında da ekleyebilirsiniz.">
          <Field id="city" label="İl" error={errors.city}>
            <Input id="city" name="city" value={form.city} onChange={(e) => update("city", e.target.value)} autoComplete="address-level1" aria-invalid={Boolean(errors.city)} className={fieldInputClass} />
          </Field>
          <Field id="district" label="İlçe" optional>
            <Input id="district" name="district" value={form.district} onChange={(e) => update("district", e.target.value)} autoComplete="address-level2" className={fieldInputClass} />
          </Field>
          <Field id="address" label="Adres" optional className="sm:col-span-2">
            <Textarea id="address" name="address" value={form.address} onChange={(e) => update("address", e.target.value)} placeholder="Mahalle, sokak, kapı no" autoComplete="street-address" className={cn(fieldInputClass, "min-h-20")} />
          </Field>
          <Field id="taxOffice" label="Vergi dairesi" optional>
            <Input id="taxOffice" name="taxOffice" value={form.taxOffice} onChange={(e) => update("taxOffice", e.target.value)} className={fieldInputClass} />
          </Field>
          <Field id="taxNumber" label="Vergi no" optional hint="Fatura için; sonra da ekleyebilirsiniz.">
            <Input id="taxNumber" name="taxNumber" inputMode="numeric" value={form.taxNumber} onChange={(e) => update("taxNumber", e.target.value)} className={fieldInputClass} />
          </Field>
        </Fieldset>

        {/* 4. Paket */}
        <Fieldset legend="Paket" hint="Hesabınız hemen Ücretsiz planla açılır. Ücretli paket seçerseniz temsilcimiz arar, ödeme sonrası paketiniz açılır; o zamana kadar ücretsiz kullanırsınız.">
          {TOPTAN_PLANS.map((p) => {
            const checked = plan === p.slug;
            const isFree = p.yearlyPrice === 0;
            return (
              <label
                key={p.slug}
                className={cn(
                  "flex cursor-pointer gap-3 rounded-lg border bg-white p-4",
                  checked ? "border-2 border-brand-green" : "border-brand-line",
                )}
              >
                <input
                  type="radio"
                  name="plan"
                  value={p.slug}
                  checked={checked}
                  onChange={() => setPlan(p.slug)}
                  className="mt-1 size-4 accent-brand-green"
                />
                <span className="flex-1">
                  <span className="flex items-baseline justify-between gap-2">
                    <span className="font-bold text-brand-navy">{p.name}</span>
                    <span className="font-plex-mono text-sm tabular-nums text-brand-navy">
                      {isFree ? "0 ₺" : `${formatTry(p.yearlyPrice)} / yıl`}
                    </span>
                  </span>
                  <span className="mt-1 block text-sm text-brand-muted">{p.tagline}</span>
                  <span className="mt-1 block text-xs text-brand-muted">
                    {p.productLimit.toLocaleString("tr-TR")} ürün · {p.priceListLimit === null ? "sınırsız" : p.priceListLimit} fiyat listesi ·{" "}
                    {isFree ? "eKatalox reklamlı" : "reklamsız"}
                  </span>
                </span>
              </label>
            );
          })}
        </Fieldset>

        {/* 5. Onay */}
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

        <div>
          <button
            type="submit"
            disabled={sending}
            className="inline-flex w-full items-center justify-center rounded-md bg-brand-green px-7 py-4 text-base font-semibold text-white hover:bg-[#126A4F] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
          >
            {sending ? "Kuruluyor" : "Kataloğumu kur"}
          </button>
          <p className="mt-3 text-sm text-brand-muted">Kataloğunuz o an açılır, giriş bilgileri e-postanıza gelir. Kart bilgisi istenmez.</p>
        </div>
      </div>

      {/* Özet */}
      <aside className="rounded-lg border border-brand-line bg-white p-6 lg:sticky lg:top-24">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-brand-muted">Özet</p>
        <dl className="mt-4 space-y-3 text-sm">
          <SummaryRow label="Açılacak plan" value="Ücretsiz" />
          {paidRequested ? <SummaryRow label="Talep edilen paket" value={selectedPlan.name} /> : null}
          <SummaryRow
            label={paidRequested ? "Paket ücreti" : "Ücret"}
            value={paidRequested ? `${formatTry(selectedPlan.yearlyPrice)} / yıl` : "0 ₺"}
            mono
            strong
          />
          {form.subdomain ? <SummaryRow label="Adres" value={`${form.subdomain}.ekatalox.com`} mono /> : null}
        </dl>
        <p className="mt-4 text-xs text-brand-muted">Fiyatlar yıllık ve KDV hariçtir.</p>
        <div className="mt-5 rounded-md bg-brand-green-soft px-4 py-3 text-sm font-semibold text-brand-green">
          Kart bilgisi istenmez, kataloğunuz hemen açılır.
        </div>
        <ul className="mt-5 space-y-2 text-sm text-brand-muted">
          <li>Ürünlerinizi Excel ile yükleyin ya da PDF/Excel&apos;inizi gönderin, biz yükleyelim.</li>
          <li>Bayilerinize şifre verin, WhatsApp&apos;tan sipariş alın.</li>
          {paidRequested ? (
            <li>Ödeme: havale/EFT ya da temsilci aracılığıyla kart. Ödeme sonrası paket açılır.</li>
          ) : (
            <li>Ücretsiz planda küçük eKatalox tanıtımları görünür; istediğiniz an paket alırsınız.</li>
          )}
        </ul>
        <p className="mt-5 text-sm">
          Sorunuz mu var?{" "}
          <a href={SITE.phoneHref} className="font-plex-mono font-semibold text-brand-navy">
            {SITE.phone}
          </a>
        </p>
      </aside>
    </form>
  );
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

function Fieldset({ legend, hint, children }: { legend: string; hint?: string; children: React.ReactNode }) {
  return (
    <fieldset className="border-t border-brand-line pt-6">
      <legend className="pr-4 text-lg font-bold text-brand-navy">{legend}</legend>
      {hint ? <p className="mt-1 text-sm text-brand-muted">{hint}</p> : null}
      <div className="mt-5 grid gap-5 sm:grid-cols-2">{children}</div>
    </fieldset>
  );
}

function SummaryRow({ label, value, mono, strong }: { label: string; value: string; mono?: boolean; strong?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="text-brand-muted">{label}</dt>
      <dd className={cn("text-right", mono && "font-plex-mono tabular-nums", strong ? "text-base font-semibold text-brand-navy" : "font-medium text-brand-ink")}>{value}</dd>
    </div>
  );
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
