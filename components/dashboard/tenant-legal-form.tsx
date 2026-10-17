"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Building2, ExternalLink, FileText, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { InlineAlert } from "@/components/ui/inline-alert";
import { SettingsSectionHeader } from "@/components/dashboard/settings-section-header";
import {
  CUSTOMIZABLE_LEGAL_DOCS,
  LEGAL_DOC_SLUGS,
  LEGAL_DOC_TITLES,
  buildLegalDocument,
  getLegalProfileProblems,
  legalDocumentToText,
  type LegalDocSlug,
  type LegalEntityType,
  type TenantLegalProfile,
} from "@/lib/legal/tenant-legal";
import { cn } from "@/lib/utils";

// Ayarlar → Yasal Bilgiler (0178, 17 Eki 2026). "İşletme Bilgileri" sekmesi
// zorunlu satıcı bilgileri; "Sözleşmeler" sekmesi bu bilgilerle üretilen
// metinler (istenirse mağazanın kendi metni). Online ödeme bunlar tamamken açılır.

function Field({
  label,
  required,
  hint,
  children,
  className,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={cn("block", className)}>
      <span className="mb-1.5 block text-sm font-medium text-slate-700">
        {label}{" "}
        {required ? (
          <span className="text-red-600">*</span>
        ) : (
          <span className="font-normal text-slate-400">(opsiyonel)</span>
        )}
      </span>
      {children}
      {hint ? <span className="mt-1 block text-xs text-slate-500">{hint}</span> : null}
    </label>
  );
}

export function LegalStatusBanner({ problems }: { problems: string[] }) {
  if (!problems.length) {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
        <strong>Yasal bilgiler tamam.</strong> Sözleşmeler mağazanızda yayında; online ödeme için gereken yasal
        koşullar sağlandı.
      </div>
    );
  }
  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
      <strong>Online ödeme için eksik bilgiler var.</strong> Tamamlanınca sözleşmeler mağazanızda yayınlanır.
      <span className="mt-1 block text-amber-800">{problems.join(" · ")}</span>
    </div>
  );
}

export function TenantLegalProfileForm({ initialProfile }: { initialProfile: TenantLegalProfile }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [entity, setEntity] = useState<LegalEntityType | null>(initialProfile.entity_type ?? null);
  const [fields, setFields] = useState({
    legal_name: initialProfile.legal_name ?? "",
    tax_office: initialProfile.tax_office ?? "",
    tax_number: initialProfile.tax_number ?? "",
    mersis_no: initialProfile.mersis_no ?? "",
    trade_registry_no: initialProfile.trade_registry_no ?? "",
    address: initialProfile.address ?? "",
    district: initialProfile.district ?? "",
    city: initialProfile.city ?? "",
    phone: initialProfile.phone ?? "",
    email: initialProfile.email ?? "",
    kep_address: initialProfile.kep_address ?? "",
    delivery_days: initialProfile.delivery_days ? String(initialProfile.delivery_days) : "",
    shipping_note: initialProfile.shipping_note ?? "",
    return_note: initialProfile.return_note ?? "",
  });
  const [confirmed, setConfirmed] = useState(Boolean(initialProfile.confirmed_at));

  const set =
    (key: keyof typeof fields) => (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setFields((current) => ({ ...current, [key]: event.target.value }));
      // Bilgi değişince onay yenilenmeli.
      setConfirmed(false);
      setError(null);
      setMessage(null);
    };

  const deliveryDays = /^\d+$/.test(fields.delivery_days.trim()) ? Number(fields.delivery_days) : null;
  const problems = getLegalProfileProblems({
    ...fields,
    entity_type: entity,
    delivery_days: deliveryDays,
    confirmed_at: "onay",
  });

  function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setMessage(null);
    if (confirmed && problems.length) {
      setError(`Onaylamadan önce tamamlayın: ${problems.join(", ")}.`);
      return;
    }
    if (fields.delivery_days.trim() && (deliveryDays === null || deliveryDays < 1 || deliveryDays > 30)) {
      setError("Teslimat süresi 1 ile 30 gün arasında bir sayı olmalı.");
      return;
    }
    startTransition(async () => {
      const response = await fetch("/api/tenant/settings/legal", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profile: { ...fields, entity_type: entity, delivery_days: deliveryDays, confirmed },
        }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(result.error ?? "Yasal bilgiler kaydedilemedi.");
        return;
      }
      setMessage(
        confirmed
          ? "Kaydedildi. Sözleşmeleriniz mağazanızda yayında."
          : "Kaydedildi. Yayınlamak için bilgileri tamamlayıp onay kutusunu işaretleyin.",
      );
      router.refresh();
    });
  }

  const company = entity === "sirket";

  return (
    <form onSubmit={save} className="space-y-6">
      <Card className="p-5">
        <SettingsSectionHeader icon={Building2} title="Satıcı (işletme) bilgileri" />
        <p className="mb-4 text-sm text-slate-500">
          Bu bilgiler mağazanızdaki Satıcı Bilgileri sayfasında ve sözleşmelerde yer alır. Ödeme kuruluşları
          (iyzico, PayTR) üye işyeri başvurusunda bu sayfaları kontrol eder.
        </p>
        <div className="mb-4 flex flex-wrap gap-2">
          {(
            [
              ["sahis", "Şahıs işletmesi"],
              ["sirket", "Şirket (Ltd. / A.Ş.)"],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => {
                setEntity(key);
                setConfirmed(false);
              }}
              aria-pressed={entity === key}
              className={cn(
                "rounded-xl border px-4 py-2 text-sm font-semibold transition",
                entity === key
                  ? "border-emerald-500 bg-emerald-50 text-emerald-800"
                  : "border-slate-200 bg-white text-slate-700 hover:border-slate-300",
              )}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={company ? "Ticaret unvanı" : "Ad soyad (işletme sahibi)"} required className="sm:col-span-2">
            <Input
              value={fields.legal_name}
              onChange={set("legal_name")}
              placeholder={company ? "Örn. Örnek Elektronik Ticaret Limited Şirketi" : "Örn. Ahmet Yılmaz"}
            />
          </Field>
          <Field label="Vergi dairesi" required>
            <Input value={fields.tax_office} onChange={set("tax_office")} placeholder="Örn. Fatih" />
          </Field>
          <Field
            label={company ? "Vergi numarası" : "TC kimlik no ya da vergi no"}
            required
            hint={company ? "10 hane" : "TC kimlik no 11, vergi no 10 hane"}
          >
            <Input value={fields.tax_number} onChange={set("tax_number")} inputMode="numeric" />
          </Field>
          <Field label="MERSİS numarası" required={company} hint="16 hane">
            <Input value={fields.mersis_no} onChange={set("mersis_no")} inputMode="numeric" />
          </Field>
          <Field label="Ticaret sicil no">
            <Input value={fields.trade_registry_no} onChange={set("trade_registry_no")} />
          </Field>
          <Field label="Açık adres" required className="sm:col-span-2">
            <Textarea
              value={fields.address}
              onChange={set("address")}
              rows={2}
              className="min-h-0"
              placeholder="Mahalle, cadde/sokak, no"
            />
          </Field>
          <Field label="İlçe" required>
            <Input value={fields.district} onChange={set("district")} />
          </Field>
          <Field label="İl" required>
            <Input value={fields.city} onChange={set("city")} />
          </Field>
          <Field label="Telefon" required>
            <Input value={fields.phone} onChange={set("phone")} inputMode="tel" placeholder="0212 000 00 00" />
          </Field>
          <Field label="E-posta" required hint="KVKK başvuruları ve iade talepleri bu adrese gelir">
            <Input value={fields.email} onChange={set("email")} inputMode="email" />
          </Field>
          <Field label="KEP adresi" className="sm:col-span-2">
            <Input value={fields.kep_address} onChange={set("kep_address")} placeholder="ornek@hs01.kep.tr" />
          </Field>
        </div>
      </Card>

      <Card className="p-5">
        <SettingsSectionHeader icon={Truck} title="Teslimat ve iade" />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Teslimat süresi (gün)"
            required
            hint="Sipariş en geç kaç günde teslim edilir / kargoya verilir (1–30)"
          >
            <Input value={fields.delivery_days} onChange={set("delivery_days")} inputMode="numeric" placeholder="Örn. 3" />
          </Field>
          <Field label="Kargo / teslimat notu" hint="Örn. Siparişler kargo ile gönderilir, 2.000 ₺ üzeri kargo ücretsiz.">
            <Input value={fields.shipping_note} onChange={set("shipping_note")} />
          </Field>
          <Field label="Mağazaya özel iade koşulları" className="sm:col-span-2" hint="İptal ve iade sayfasına eklenir.">
            <Textarea value={fields.return_note} onChange={set("return_note")} rows={3} className="min-h-0" />
          </Field>
        </div>
      </Card>

      <Card className="p-5">
        <label className="flex items-start gap-3 text-sm text-slate-700">
          <input
            type="checkbox"
            className="mt-1 size-4"
            checked={confirmed}
            onChange={(event) => {
              setConfirmed(event.target.checked);
              setError(null);
            }}
          />
          <span>
            Bilgilerin doğru ve güncel olduğunu, sözleşme metinlerinin bu bilgilerle mağazamda yayınlanacağını
            onaylıyorum. <span className="text-red-600">*</span>
          </span>
        </label>
        {problems.length ? <p className="mt-3 text-xs text-amber-700">Eksik: {problems.join(" · ")}</p> : null}
      </Card>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-h-6 space-y-1">
          <InlineAlert message={message} onExpire={() => setMessage(null)} />
          <InlineAlert message={error} tone="error" onExpire={() => setError(null)} />
        </div>
        <Button type="submit" disabled={pending}>
          {pending ? "Kaydediliyor..." : "Yasal bilgileri kaydet"}
        </Button>
      </div>
    </form>
  );
}

export function TenantLegalDocumentsForm({
  initialProfile,
  storeName,
  storeUrl,
  isPublished,
}: {
  initialProfile: TenantLegalProfile;
  storeName: string;
  storeUrl: string;
  isPublished: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [openSlug, setOpenSlug] = useState<LegalDocSlug | null>(null);
  const [drafts, setDrafts] = useState<Partial<Record<LegalDocSlug, string>>>(() =>
    Object.fromEntries(CUSTOMIZABLE_LEGAL_DOCS.map((slug) => [slug, initialProfile.documents?.[slug]?.custom ?? ""])),
  );
  const templates = useMemo(
    () =>
      Object.fromEntries(
        LEGAL_DOC_SLUGS.map((slug) => [
          slug,
          buildLegalDocument(slug, { ...initialProfile, documents: null }, storeName, storeUrl),
        ]),
      ) as Record<LegalDocSlug, ReturnType<typeof buildLegalDocument>>,
    [initialProfile, storeName, storeUrl],
  );

  function saveDoc(slug: LegalDocSlug, custom: string | null) {
    setError(null);
    setMessage(null);
    startTransition(async () => {
      const response = await fetch("/api/tenant/settings/legal", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documents: { [slug]: { custom } } }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(result.error ?? "Metin kaydedilemedi.");
        return;
      }
      setDrafts((current) => ({ ...current, [slug]: custom ?? "" }));
      setMessage(
        custom
          ? `${LEGAL_DOC_TITLES[slug]}: kendi metniniz kaydedildi.`
          : `${LEGAL_DOC_TITLES[slug]}: otomatik şablona dönüldü.`,
      );
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-500">
        Metinler İşletme Bilgileri sekmesindeki bilgilerinizle otomatik hazırlanır. Genel şablonlardır; işinize
        uygunluğunu bir avukata kontrol ettirmenizi öneririz. İsterseniz kendi metninizi yazabilirsiniz.
      </p>
      {LEGAL_DOC_SLUGS.map((slug) => {
        const customizable = CUSTOMIZABLE_LEGAL_DOCS.includes(slug);
        const saved = initialProfile.documents?.[slug]?.custom?.trim();
        const editing = openSlug === slug;
        return (
          <Card key={slug} className="p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex gap-3">
                <FileText className="mt-0.5 size-5 shrink-0 text-slate-500" />
                <div>
                  <p className="text-sm font-semibold text-slate-900">{LEGAL_DOC_TITLES[slug]}</p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {saved
                      ? "Kendi metniniz kullanılıyor"
                      : customizable
                        ? "Otomatik şablon"
                        : "Bilgilerinizden otomatik üretilir"}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {isPublished ? (
                  <a
                    href={`${storeUrl}/yasal/${slug}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-slate-200 px-3 text-sm font-semibold text-slate-700 hover:border-slate-300"
                  >
                    <ExternalLink className="size-4" /> Mağazada gör
                  </a>
                ) : null}
                <Button
                  type="button"
                  variant="secondary"
                  className="h-9"
                  onClick={() => setOpenSlug(editing ? null : slug)}
                >
                  {editing ? "Kapat" : customizable ? "Önizle / düzenle" : "Önizle"}
                </Button>
              </div>
            </div>

            {editing ? (
              <div className="mt-4 space-y-3">
                {customizable ? (
                  <>
                    <Textarea
                      rows={14}
                      value={drafts[slug] || legalDocumentToText(templates[slug])}
                      onChange={(event) => setDrafts((current) => ({ ...current, [slug]: event.target.value }))}
                      className="font-mono text-xs"
                    />
                    <p className="text-xs text-slate-500">
                      Paragrafları boş satırla ayırın. Kaydetmezseniz otomatik şablon kullanılmaya devam eder.
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        disabled={pending}
                        onClick={() => saveDoc(slug, drafts[slug] || legalDocumentToText(templates[slug]))}
                      >
                        Kendi metnim olarak kaydet
                      </Button>
                      {saved ? (
                        <Button type="button" variant="secondary" disabled={pending} onClick={() => saveDoc(slug, null)}>
                          Otomatik şablona dön
                        </Button>
                      ) : null}
                    </div>
                  </>
                ) : (
                  <div className="space-y-1.5 rounded-xl bg-slate-50 p-4 text-sm text-slate-700">
                    {templates[slug].sections
                      .flatMap((section) => section.paragraphs)
                      .map((line, index) => (
                        <p key={index}>{line}</p>
                      ))}
                  </div>
                )}
              </div>
            ) : null}
          </Card>
        );
      })}
      <div className="min-h-6 space-y-1">
        <InlineAlert message={message} onExpire={() => setMessage(null)} />
        <InlineAlert message={error} tone="error" onExpire={() => setError(null)} />
      </div>
    </div>
  );
}
