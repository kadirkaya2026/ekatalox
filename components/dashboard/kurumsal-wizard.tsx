"use client";

// Kurumsal site sihirbazı (Ayarlar → Kurumsal Site). 8 adım: alan adı
// (atlanabilir) → firma bilgileri → sektör → başlık & slogan → hakkımızda → neden biz → görünüm
// → önizle & yayınla. Metin önerileri lib/kurumsal/presets.ts'deki elle
// yazılmış sektör şablonlarından gelir (yapay zekâ yok); bayinin girmediği
// bilgi (kuruluş yılı, il) içeren cümleler hiç önerilmez. Her "Kaydet ve
// devam et" içeriği PUT /api/tenant/kurumsal ile kaydeder (yayın durumu
// değişmez), böylece sihirbaz kapatılsa da iş kaybolmaz. Görünüm/akış
// kurulum sihirbazıyla (onboarding-wizard.tsx) aynı.
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ExternalLink,
  Globe,
  Loader2,
  MessageCircle,
  Search,
  Plus,
  RefreshCw,
  Sparkles,
  Trash2,
  Wand2,
} from "lucide-react";
import { KurumsalDomainCard } from "@/components/dashboard/kurumsal-domain-card";
import { KurumsalView, type KurumsalContact } from "@/components/kurumsal/kurumsal-view";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  KURUMSAL_CUSTOMER_TYPES,
  KURUMSAL_PRESETS,
  buildTemplateVars,
  getKurumsalPreset,
  pickDefaultHighlights,
  renderHighlightOptions,
  renderTemplates,
  type KurumsalTemplateVars,
} from "@/lib/kurumsal/presets";
import { kurumsalContentSchema, type KurumsalContent, type KurumsalSiteRecord } from "@/lib/kurumsal/schema";
import type { KurumsalData } from "@/lib/storefront/kurumsal-data";
import { cn } from "@/lib/utils";

export interface KurumsalWizardContext {
  tenantName: string;
  /** Şablonlardaki {firma} karşılığı (mağaza adı) */
  firma: string;
  subdomain: string;
  logoUrl: string | null;
  wordmark: string | null;
  /** İçerikte renk seçilmezse kullanılan renk (kapı markası / marka rengi) */
  fallbackAccent: string;
  /** İçerikte görsel seçilmezse kullanılan hero görseli */
  fallbackHero: string | null;
  heroOptions: string[];
  contact: KurumsalContact;
  data: KurumsalData;
  isWhiteLabel: boolean;
  /** https://{kurumsal_domain}; alan adı bağlı değilse null */
  publicUrl: string | null;
  /** Katalog/sipariş ekranı ("Bayi Girişi" — önizlemede tıklanmaz) */
  catalogUrl: string;
}

const STEPS = [
  "Alan adı",
  "Firma bilgileri",
  "Sektör",
  "Başlık & slogan",
  "Hakkımızda",
  "Neden biz",
  "Görünüm",
  "Önizle & yayınla",
] as const;

const ACCENT_SWATCHES = ["#F58220", "#DC2626", "#DB2777", "#7C3AED", "#2563EB", "#0891B2", "#059669", "#CA8A04", "#0F172A"];

const HEX_RE = /^#[0-9a-fA-F]{6}$/;

type SaveResult = { ok: true; site: KurumsalSiteRecord } | { ok: false };

/** Kaydetmeden önce boş paragrafları/özellikleri ve yarım rozeti temizler. */
function cleanContent(content: KurumsalContent): KurumsalContent {
  const badgeValue = content.badge?.value.trim() ?? "";
  const badgeLabel = content.badge?.label.trim() ?? "";
  return {
    ...content,
    about: content.about.map((p) => p.trim()).filter(Boolean),
    highlights: content.highlights
      .map((h) => ({ title: h.title.trim(), body: h.body.trim() }))
      .filter((h) => h.title),
    badge: badgeValue && badgeLabel ? { value: badgeValue, label: badgeLabel } : null,
  };
}

export function KurumsalWizard({
  open,
  onClose,
  initialContent,
  initialPublished,
  ctx,
  onSaved,
  initialDomain,
  domainRequestHref,
  onDomainChange,
}: {
  open: boolean;
  onClose: () => void;
  initialContent: KurumsalContent;
  initialPublished: boolean;
  ctx: KurumsalWizardContext;
  onSaved: (site: KurumsalSiteRecord) => void;
  initialDomain: string | null;
  domainRequestHref: string;
  onDomainChange: (domain: string | null) => void;
}) {
  const [draft, setDraft] = useState<KurumsalContent>(initialContent);
  const [published, setPublished] = useState(initialPublished);
  const [index, setIndex] = useState(0);
  const [pending, setPending] = useState<null | "save" | "publish">(null);
  const [error, setError] = useState<string | null>(null);
  const [justPublished, setJustPublished] = useState(false);
  const bodyRef = useRef<HTMLDivElement>(null);

  const vars = useMemo(
    () =>
      buildTemplateVars({
        firma: ctx.firma,
        city: draft.city,
        foundedYear: draft.founded_year,
        customerType: draft.customer_type,
      }),
    [ctx.firma, draft.city, draft.founded_year, draft.customer_type],
  );

  function patch(update: Partial<KurumsalContent>) {
    setDraft((current) => ({ ...current, ...update }));
  }

  function go(next: number) {
    setError(null);
    setIndex(Math.min(Math.max(next, 0), STEPS.length - 1));
    bodyRef.current?.scrollTo({ top: 0 });
  }

  async function save(isPublished?: boolean): Promise<SaveResult> {
    setError(null);
    const content = cleanContent(draft);
    const parsed = kurumsalContentSchema.safeParse(content);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Bilgileri kontrol edin.");
      return { ok: false };
    }
    try {
      const res = await fetch("/api/tenant/kurumsal", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: parsed.data, ...(isPublished === undefined ? {} : { is_published: isPublished }) }),
      });
      const result = (await res.json().catch(() => null)) as { error?: string; site?: KurumsalSiteRecord } | null;
      if (!res.ok || !result?.site) {
        setError(result?.error ?? "Kaydedilemedi.");
        return { ok: false };
      }
      setDraft(parsed.data);
      setPublished(result.site.is_published);
      onSaved(result.site);
      return { ok: true, site: result.site };
    } catch {
      setError("Bağlantı kurulamadı.");
      return { ok: false };
    }
  }

  async function saveAndNext() {
    setPending("save");
    const result = await save();
    setPending(null);
    if (result.ok) go(index + 1);
  }

  async function saveDraft() {
    setPending("save");
    await save();
    setPending(null);
  }

  async function publish() {
    setPending("publish");
    const result = await save(true);
    setPending(null);
    if (result.ok) setJustPublished(true);
  }

  const isLast = index === STEPS.length - 1;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Kurumsal sitenizi hazırlayalım"
      sheet
      panelClassName="max-w-4xl"
      bodyClassName="p-0"
      contentScroll={false}
    >
      <div className="flex min-h-0 flex-1 flex-col">
        {/* adım çubuğu */}
        <div className="shrink-0 border-b border-slate-100 px-4 py-3 sm:px-6 dark:border-slate-800">
          <ol className="flex items-center gap-1.5 overflow-x-auto">
            {STEPS.map((title, i) => {
              const active = i === index;
              const passed = i < index;
              return (
                <li key={title} className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => go(i)}
                    aria-current={active ? "step" : undefined}
                    title={title}
                    className={cn(
                      "flex size-7 shrink-0 items-center justify-center rounded-full border-2 text-xs font-bold transition",
                      active
                        ? "border-emerald-600 bg-emerald-600 text-white ring-4 ring-emerald-100 dark:ring-emerald-900"
                        : passed
                          ? "border-emerald-600 bg-emerald-600 text-white"
                          : "border-slate-200 bg-card text-slate-400 dark:border-slate-700",
                    )}
                  >
                    {passed ? <Check className="size-3.5" strokeWidth={3} /> : i + 1}
                  </button>
                  {i < STEPS.length - 1 ? (
                    <span
                      className={cn(
                        "h-0.5 w-4 shrink-0 rounded-full sm:w-7",
                        passed ? "bg-emerald-500" : "bg-slate-200 dark:bg-slate-700",
                      )}
                    />
                  ) : null}
                </li>
              );
            })}
          </ol>
          <div className="mt-2 flex items-center justify-between gap-3 text-xs">
            <span className="font-semibold text-emerald-700 dark:text-emerald-400">
              Adım {index + 1}/{STEPS.length} · {STEPS[index]}
            </span>
            <span className={published ? "font-semibold text-emerald-700 dark:text-emerald-400" : "text-muted-foreground"}>
              {published ? "Yayında — kaydettiğiniz değişiklik hemen yansır" : "Taslak"}
            </span>
          </div>
        </div>

        {/* adım içeriği */}
        <div ref={bodyRef} className="min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-6">
          {index === 0 ? (
            <DomainStep
              initialDomain={initialDomain}
              domainRequestHref={domainRequestHref}
              onDomainChange={onDomainChange}
            />
          ) : null}
          {index === 1 ? <CompanyStep draft={draft} patch={patch} /> : null}
          {index === 2 ? <SectorStep draft={draft} setDraft={setDraft} vars={vars} /> : null}
          {index === 3 ? <HeadlineStep draft={draft} patch={patch} vars={vars} /> : null}
          {index === 4 ? <AboutStep draft={draft} patch={patch} vars={vars} /> : null}
          {index === 5 ? <HighlightsStep draft={draft} patch={patch} vars={vars} /> : null}
          {index === 6 ? <AppearanceStep draft={draft} patch={patch} ctx={ctx} /> : null}
          {index === 7 ? (
            <PreviewStep draft={draft} ctx={ctx} published={published} justPublished={justPublished} />
          ) : null}

          {error ? (
            <p className="mt-4 text-sm text-rose-600" role="alert">
              {error}
            </p>
          ) : null}

          <div className="mt-6 flex flex-wrap justify-end gap-3">
            {isLast ? (
              <>
                <Button variant="secondary" onClick={saveDraft} disabled={pending !== null}>
                  {pending === "save" ? <Loader2 className="size-4 animate-spin" /> : null}
                  {published ? "Kaydet" : "Taslak kaydet"}
                </Button>
                <Button
                  onClick={publish}
                  disabled={pending !== null || !ctx.publicUrl}
                  title={ctx.publicUrl ? undefined : "Yayınlamak için önce alan adı bağlayın (1. adım)."}
                >
                  {pending === "publish" ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
                  {published ? "Kaydet ve yayında tut" : "Yayınla"}
                </Button>
              </>
            ) : index === 0 ? (
              <Button onClick={() => go(1)}>
                {ctx.publicUrl ? "Devam et" : "Şimdilik atla"} <ArrowRight className="size-4" />
              </Button>
            ) : (
              <Button onClick={saveAndNext} disabled={pending !== null}>
                {pending ? <Loader2 className="size-4 animate-spin" /> : null} Kaydet ve devam et <ArrowRight className="size-4" />
              </Button>
            )}
          </div>
        </div>

        {/* alt bar */}
        <div className="flex shrink-0 items-center justify-between gap-3 border-t border-slate-100 px-4 py-3 sm:px-6 dark:border-slate-800">
          <div>
            {index > 0 ? (
              <Button variant="ghost" onClick={() => go(index - 1)}>
                <ArrowLeft className="size-4" /> Geri
              </Button>
            ) : null}
          </div>
          <div className="flex items-center gap-3">
            {isLast ? null : (
              <Button variant="ghost" onClick={() => go(index + 1)}>
                Kaydetmeden geç
              </Button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="text-xs text-muted-foreground underline underline-offset-4 hover:text-foreground"
            >
              Kapat
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}

/* ───────────────────────── Ortak parçalar ───────────────────────── */

type PatchFn = (update: Partial<KurumsalContent>) => void;

function StepIntro({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-5">
      <h4 className="text-xl font-semibold text-foreground">{title}</h4>
      <p className="mt-1.5 text-sm leading-6 text-muted-foreground">{children}</p>
    </div>
  );
}

function Field({
  label,
  hint,
  children,
  counter,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
  counter?: string;
}) {
  return (
    <label className="block">
      <span className="flex items-baseline justify-between gap-2">
        <span className="text-sm font-semibold">{label}</span>
        {counter ? <span className="text-xs text-muted-foreground">{counter}</span> : null}
      </span>
      <span className="mt-1.5 block">{children}</span>
      {hint ? <span className="mt-1 block text-xs text-muted-foreground">{hint}</span> : null}
    </label>
  );
}

function SuggestionChips({
  options,
  value,
  onPick,
}: {
  options: string[];
  value: string;
  onPick: (value: string) => void;
}) {
  if (!options.length) return null;
  return (
    <div className="mt-2 flex flex-wrap gap-2">
      {options.map((option) => {
        const active = option === value;
        return (
          <button
            key={option}
            type="button"
            onClick={() => onPick(option)}
            className={cn(
              "rounded-full border px-3 py-1.5 text-left text-xs font-medium transition",
              active
                ? "border-emerald-600 bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200"
                : "border-slate-200 text-muted-foreground hover:border-emerald-300 hover:text-foreground dark:border-slate-700",
            )}
          >
            {active ? <Check className="mr-1 inline size-3" strokeWidth={3} /> : null}
            {option}
          </button>
        );
      })}
    </div>
  );
}

/* 0 — Alan adı (atlanabilir) */
// İki yol: "Kendi alan adım var" → self-servis bağlama (Vercel + DNS kayıtları +
// Kontrol et, KurumsalDomainCard). "Yeni alan adı seç" → şimdilik yer tutucu;
// alan adı arama/satın alma ayrı iş olarak DomainPurchasePanel yerine takılacak.
function DomainStep({
  initialDomain,
  domainRequestHref,
  onDomainChange,
}: {
  initialDomain: string | null;
  domainRequestHref: string;
  onDomainChange: (domain: string | null) => void;
}) {
  const [mode, setMode] = useState<"own" | "new" | null>(initialDomain ? "own" : null);
  const options = [
    { key: "own" as const, icon: Globe, title: "Kendi alan adım var", body: "firmaniz.com gibi bir alan adınız varsa bağlayın; DNS kayıtlarını size gösteririz." },
    { key: "new" as const, icon: Search, title: "Yeni alan adı seç", body: "Henüz alan adınız yoksa sizin için uygun bir tane bulalım." },
  ];

  return (
    <div>
      <StepIntro title="Siteniz hangi adreste açılsın?">
        Kurumsal siteniz kendi alan adınızın kökünde yayınlanır (ör. firmaniz.com). Bu adımı atlayabilirsiniz; siteniz taslak olarak
        hazırlanır, alan adı bağlanınca yayınlayabilirsiniz.
      </StepIntro>
      <div className="grid gap-3 sm:grid-cols-2">
        {options.map((option) => {
          const active = mode === option.key;
          const Icon = option.icon;
          return (
            <button
              key={option.key}
              type="button"
              onClick={() => setMode(option.key)}
              className={cn(
                "flex gap-3 rounded-xl border-2 bg-card p-4 text-left transition",
                active
                  ? "border-emerald-600 ring-4 ring-emerald-100 dark:ring-emerald-900"
                  : "border-slate-200 hover:border-emerald-300 dark:border-slate-700",
              )}
            >
              <Icon className="mt-0.5 size-5 shrink-0 text-emerald-700 dark:text-emerald-400" />
              <span>
                <span className="block text-sm font-semibold">{option.title}</span>
                <span className="mt-1 block text-xs leading-5 text-muted-foreground">{option.body}</span>
              </span>
            </button>
          );
        })}
      </div>
      <div className="mt-5">
        {mode === "own" ? (
          <KurumsalDomainCard
            initialDomain={initialDomain}
            domainRequestHref={domainRequestHref}
            onDomainChange={onDomainChange}
          />
        ) : null}
        {mode === "new" ? <DomainPurchasePanel domainRequestHref={domainRequestHref} /> : null}
      </div>
    </div>
  );
}

// Alan adı arama + satın alma buraya gelecek (ayrı iş). Şimdilik destek talebi.
function DomainPurchasePanel({ domainRequestHref }: { domainRequestHref: string }) {
  return (
    <div className="rounded-xl border border-dashed border-slate-300 p-5 dark:border-slate-700">
      <p className="text-sm font-semibold">Yakında: alan adı arama ve satın alma</p>
      <p className="mt-1 text-sm leading-6 text-muted-foreground">
        Çok yakında uygun alan adını buradan arayıp tek tıkla alabileceksiniz. Şimdilik bize yazın; sizin için alan adını alıp
        bağlayalım.
      </p>
      <a
        href={domainRequestHref}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-4 inline-flex items-center gap-2 rounded-lg bg-[#25D366] px-4 py-2 text-sm font-semibold text-white"
      >
        <MessageCircle className="size-4" /> WhatsApp&apos;tan talep et
      </a>
    </div>
  );
}

/* 1 — Firma bilgileri */
function CompanyStep({ draft, patch }: { draft: KurumsalContent; patch: PatchFn }) {
  const currentYear = new Date().getFullYear();
  return (
    <div>
      <StepIntro title="Firmanızı tanıyalım">
        Bu bilgiler iletişim bölümünde ve hazır metinlerde kullanılır. Boş bıraktığınız bilgi sitede hiç geçmez; örneğin kuruluş
        yılını yazmazsanız &quot;... yılından bu yana&quot; cümlesi önerilmez.
      </StepIntro>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Field label="Resmi unvan" hint="Sayfanın altında ve iletişim bölümünde görünür. Örn. Yıldız İletişim Tic. Ltd. Şti.">
            <Input
              value={draft.legal_name ?? ""}
              onChange={(e) => patch({ legal_name: e.target.value })}
              maxLength={160}
              placeholder="Firma unvanı (isteğe bağlı)"
            />
          </Field>
        </div>
        <Field label="Telefon" hint="Boş bırakılırsa Footer ayarlarındaki telefon kullanılır.">
          <Input
            value={draft.phone ?? ""}
            onChange={(e) => patch({ phone: e.target.value })}
            maxLength={40}
            inputMode="tel"
            placeholder="+90 (212) 000 00 00"
          />
        </Field>
        <Field label="İl" hint="Örn. İstanbul — hazır metinlerde “İstanbul merkezli” olarak geçer.">
          <Input value={draft.city ?? ""} onChange={(e) => patch({ city: e.target.value })} maxLength={60} placeholder="İstanbul" />
        </Field>
        <Field label="Kuruluş yılı" hint="İsteğe bağlı.">
          <Input
            value={draft.founded_year ?? ""}
            onChange={(e) => {
              const digits = e.target.value.replace(/\D/g, "").slice(0, 4);
              patch({ founded_year: digits ? Number(digits) : undefined });
            }}
            inputMode="numeric"
            placeholder={String(currentYear - 10)}
          />
        </Field>
        <Field label="Kimlere satış yapıyorsunuz?">
          <Select value={draft.customer_type ?? ""} onChange={(e) => patch({ customer_type: e.target.value || undefined })}>
            <option value="">Seçin</option>
            {KURUMSAL_CUSTOMER_TYPES.map((type) => (
              <option key={type.key} value={type.key}>
                {type.label}
              </option>
            ))}
          </Select>
        </Field>
      </div>
    </div>
  );
}

/* 2 — Sektör */
function SectorStep({
  draft,
  setDraft,
  vars,
}: {
  draft: KurumsalContent;
  setDraft: React.Dispatch<React.SetStateAction<KurumsalContent>>;
  vars: KurumsalTemplateVars;
}) {
  function choose(key: string) {
    setDraft((current) => {
      if (current.sector === key) return current;
      const oldPreset = getKurumsalPreset(current.sector);
      const next = getKurumsalPreset(key);
      // Bayinin elle değiştirmediği (hâlâ eski sektörün önerisi olan) metinler
      // yeni sektörün ilk önerisiyle değişir; elle yazılanlara dokunulmaz.
      const untouched = (value: string, options: string[]) => !value.trim() || options.includes(value);
      const oldTaglines = renderTemplates(oldPreset.taglines, vars);
      const oldAbout = renderTemplates(oldPreset.about, vars);
      const oldHighlightTitles = renderHighlightOptions(oldPreset.key, vars).map((h) => h.title);
      return {
        ...current,
        sector: next.key,
        eyebrow: untouched(current.eyebrow, oldPreset.eyebrows) ? next.eyebrows[0] : current.eyebrow,
        headline: untouched(current.headline, oldPreset.headlines) ? next.headlines[0] : current.headline,
        tagline: untouched(current.tagline, oldTaglines)
          ? (renderTemplates(next.taglines, vars)[0] ?? current.tagline)
          : current.tagline,
        about:
          current.about.length && current.about.every((p) => oldAbout.includes(p))
            ? renderTemplates(next.about, vars).slice(0, current.about.length)
            : current.about,
        highlights:
          current.highlights.length && current.highlights.every((h) => oldHighlightTitles.includes(h.title))
            ? pickDefaultHighlights(next.key, vars)
            : current.highlights,
      };
    });
  }

  return (
    <div>
      <StepIntro title="Hangi sektördesiniz?">
        Sektörünüze göre başlık, slogan ve &quot;Hakkımızda&quot; önerileri hazırlarız. Önerileri sonraki adımlarda dilediğiniz gibi
        değiştirebilirsiniz.
      </StepIntro>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {KURUMSAL_PRESETS.map((preset) => {
          const active = draft.sector === preset.key;
          return (
            <button
              key={preset.key}
              type="button"
              onClick={() => choose(preset.key)}
              className={cn(
                "relative rounded-xl border-2 bg-card p-4 text-left transition",
                active
                  ? "border-emerald-600 ring-4 ring-emerald-100 dark:ring-emerald-900"
                  : "border-slate-200 hover:border-emerald-300 dark:border-slate-700",
              )}
            >
              {active ? (
                <span className="absolute right-3 top-3 flex size-6 items-center justify-center rounded-full bg-emerald-600 text-white">
                  <Check className="size-3.5" strokeWidth={3} />
                </span>
              ) : null}
              <p className="pr-8 text-sm font-semibold">{preset.label}</p>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">{preset.hint}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* 3 — Başlık & slogan */
function HeadlineStep({ draft, patch, vars }: { draft: KurumsalContent; patch: PatchFn; vars: KurumsalTemplateVars }) {
  const preset = getKurumsalPreset(draft.sector);
  const taglines = useMemo(() => renderTemplates(preset.taglines, vars), [preset, vars]);
  const [set, setSet] = useState(0);

  function nextSuggestion() {
    const next = (set + 1) % 3;
    setSet(next);
    patch({
      eyebrow: preset.eyebrows[next % preset.eyebrows.length],
      headline: preset.headlines[next % preset.headlines.length],
      ...(taglines.length ? { tagline: taglines[next % taglines.length] } : {}),
    });
  }

  return (
    <div>
      <StepIntro title="Başlık ve slogan">
        Sayfanın en üstündeki büyük alan. Öneriye dokunarak seçin ya da kendiniz yazın; &quot;Başka öneri göster&quot; üç alanı
        birlikte doldurur.
      </StepIntro>
      <div className="mb-4 flex justify-end">
        <Button variant="secondary" onClick={nextSuggestion}>
          <RefreshCw className="size-4" /> Başka öneri göster
        </Button>
      </div>
      <div className="space-y-5">
        <div>
          <Field label="Üst etiket" counter={`${draft.eyebrow.length}/60`} hint="Başlığın üstündeki küçük, renkli yazı.">
            <Input value={draft.eyebrow} onChange={(e) => patch({ eyebrow: e.target.value })} maxLength={60} />
          </Field>
          <SuggestionChips options={preset.eyebrows} value={draft.eyebrow} onPick={(value) => patch({ eyebrow: value })} />
        </div>
        <div>
          <Field label="Ana başlık" counter={`${draft.headline.length}/90`}>
            <Input value={draft.headline} onChange={(e) => patch({ headline: e.target.value })} maxLength={90} />
          </Field>
          <SuggestionChips options={preset.headlines} value={draft.headline} onPick={(value) => patch({ headline: value })} />
        </div>
        <div>
          <Field label="Slogan" counter={`${draft.tagline.length}/260`} hint="Başlığın altındaki bir-iki cümlelik tanıtım.">
            <Textarea
              value={draft.tagline}
              onChange={(e) => patch({ tagline: e.target.value })}
              maxLength={260}
              className="min-h-20"
            />
          </Field>
          <SuggestionChips options={taglines} value={draft.tagline} onPick={(value) => patch({ tagline: value })} />
        </div>
      </div>
    </div>
  );
}

/* 4 — Hakkımızda */
function AboutStep({ draft, patch, vars }: { draft: KurumsalContent; patch: PatchFn; vars: KurumsalTemplateVars }) {
  const preset = getKurumsalPreset(draft.sector);
  const templates = useMemo(() => renderTemplates(preset.about, vars), [preset, vars]);
  const paragraphs = draft.about.length ? draft.about : [""];

  function fill() {
    const hasText = draft.about.some((p) => p.trim());
    if (hasText && !window.confirm("Yazdığınız metin hazır metinle değiştirilsin mi?")) return;
    patch({ about: templates.slice(0, 4) });
  }

  function setParagraph(i: number, value: string) {
    const next = [...paragraphs];
    next[i] = value;
    patch({ about: next });
  }

  return (
    <div>
      <StepIntro title="Hakkımızda">
        Firmanızı birkaç paragrafta anlatın. &quot;Hazır metinle doldur&quot; sektörünüze uygun bir taslak yazar; yalnızca verdiğiniz
        bilgileri kullanır, sonra dilediğiniz gibi düzenleyin.
      </StepIntro>
      <div className="mb-4 flex flex-wrap justify-end gap-2">
        <Button variant="secondary" onClick={fill} disabled={!templates.length}>
          <Wand2 className="size-4" /> Hazır metinle doldur
        </Button>
      </div>
      <div className="space-y-4">
        {paragraphs.map((paragraph, i) => (
          <div key={i} className="relative">
            <Field label={`${i + 1}. paragraf`} counter={`${paragraph.length}/1200`}>
              <Textarea
                value={paragraph}
                onChange={(e) => setParagraph(i, e.target.value)}
                maxLength={1200}
                className="min-h-28"
                placeholder="Örn. Firmamız 2010 yılından bu yana..."
              />
            </Field>
            {paragraphs.length > 1 ? (
              <button
                type="button"
                onClick={() => patch({ about: paragraphs.filter((_, j) => j !== i) })}
                className="absolute right-0 top-0 inline-flex items-center gap-1 text-xs font-medium text-rose-600 hover:text-rose-700"
              >
                <Trash2 className="size-3.5" /> Sil
              </button>
            ) : null}
          </div>
        ))}
      </div>
      {paragraphs.length < 4 ? (
        <Button variant="ghost" className="mt-3" onClick={() => patch({ about: [...paragraphs, ""] })}>
          <Plus className="size-4" /> Paragraf ekle
        </Button>
      ) : null}
    </div>
  );
}

/* 5 — Neden biz */
function HighlightsStep({ draft, patch, vars }: { draft: KurumsalContent; patch: PatchFn; vars: KurumsalTemplateVars }) {
  const options = useMemo(() => renderHighlightOptions(draft.sector, vars), [draft.sector, vars]);
  const selectedTitles = new Set(draft.highlights.map((h) => h.title));
  const full = draft.highlights.length >= 4;

  function toggle(option: { title: string; body: string }) {
    if (selectedTitles.has(option.title)) {
      patch({ highlights: draft.highlights.filter((h) => h.title !== option.title) });
    } else if (!full) {
      patch({ highlights: [...draft.highlights, option] });
    }
  }

  function edit(i: number, update: Partial<{ title: string; body: string }>) {
    patch({ highlights: draft.highlights.map((h, j) => (j === i ? { ...h, ...update } : h)) });
  }

  const badge = draft.badge ?? { value: "", label: "" };

  return (
    <div>
      <StepIntro title="Neden sizi tercih etmeliler?">
        En fazla 4 özellik seçin; seçtiklerinizin başlığını ve açıklamasını aşağıda düzenleyebilirsiniz. Öneriler bayi portalınızın
        gerçekten sunduğu şeylerdir — garanti süresi gibi iddiaları yalnızca siz yazarsınız.
      </StepIntro>
      <div className="grid gap-3 sm:grid-cols-2">
        {options.map((option) => {
          const active = selectedTitles.has(option.title);
          return (
            <button
              key={option.title}
              type="button"
              onClick={() => toggle(option)}
              disabled={!active && full}
              className={cn(
                "flex gap-3 rounded-xl border-2 bg-card p-3 text-left transition disabled:opacity-50",
                active
                  ? "border-emerald-600 bg-emerald-50/60 dark:bg-emerald-950/40"
                  : "border-slate-200 hover:border-emerald-300 dark:border-slate-700",
              )}
            >
              <span
                className={cn(
                  "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded border-2",
                  active ? "border-emerald-600 bg-emerald-600 text-white" : "border-slate-300 dark:border-slate-600",
                )}
              >
                {active ? <Check className="size-3" strokeWidth={3} /> : null}
              </span>
              <span>
                <span className="block text-sm font-semibold">{option.title}</span>
                <span className="mt-0.5 block text-xs leading-5 text-muted-foreground">{option.body}</span>
              </span>
            </button>
          );
        })}
      </div>

      <div className="mt-6">
        <p className="text-sm font-semibold">Seçilenler ({draft.highlights.length}/4)</p>
        <div className="mt-2 space-y-3">
          {draft.highlights.map((highlight, i) => (
            <div key={i} className="rounded-xl border border-slate-200 p-3 dark:border-slate-700">
              <div className="flex items-start gap-2">
                <span className="mt-2.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-xs font-bold text-white">
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1 space-y-2">
                  <Input
                    value={highlight.title}
                    onChange={(e) => edit(i, { title: e.target.value })}
                    maxLength={60}
                    placeholder="Başlık"
                    className="py-2"
                  />
                  <Textarea
                    value={highlight.body}
                    onChange={(e) => edit(i, { body: e.target.value })}
                    maxLength={240}
                    placeholder="Kısa açıklama"
                    className="min-h-16 py-2"
                  />
                </div>
                <button
                  type="button"
                  aria-label="Kaldır"
                  onClick={() => patch({ highlights: draft.highlights.filter((_, j) => j !== i) })}
                  className="mt-2 rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-rose-600"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
        {!full ? (
          <Button
            variant="ghost"
            className="mt-2"
            onClick={() => patch({ highlights: [...draft.highlights, { title: "", body: "" }] })}
          >
            <Plus className="size-4" /> Kendi özelliğinizi ekleyin
          </Button>
        ) : null}
      </div>

      <div className="mt-6 rounded-xl border border-dashed border-slate-300 p-4 dark:border-slate-700">
        <p className="text-sm font-semibold">Rozet (isteğe bağlı)</p>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">
          Ürün ve kategori sayısının yanında büyük yazıyla görünür. Örn. &quot;2 Yıl&quot; · &quot;Garanti&quot;. Yalnızca gerçekten
          sunduğunuz bir şeyi yazın; iki alan da doluysa gösterilir.
        </p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <Input
            value={badge.value}
            onChange={(e) => patch({ badge: { ...badge, value: e.target.value } })}
            maxLength={20}
            placeholder="Değer (örn. 2 Yıl)"
          />
          <Input
            value={badge.label}
            onChange={(e) => patch({ badge: { ...badge, label: e.target.value } })}
            maxLength={30}
            placeholder="Etiket (örn. Garanti)"
          />
        </div>
      </div>
    </div>
  );
}

/* 6 — Görünüm */
function AppearanceStep({ draft, patch, ctx }: { draft: KurumsalContent; patch: PatchFn; ctx: KurumsalWizardContext }) {
  const [hexInput, setHexInput] = useState(draft.accent_color ?? "");
  const activeAccent = draft.accent_color ?? ctx.fallbackAccent;
  const sectionToggles: Array<{ key: keyof KurumsalContent["sections"]; label: string; hint: string }> = [
    { key: "featured", label: "Öne çıkan ürünler", hint: "Kataloğunuzdan 12 ürün (fiyatsız)." },
    { key: "steps", label: "Bayilik adımları", hint: "\"3 adımda bayimiz olun\" bölümü." },
    { key: "map", label: "Harita", hint: "Footer ayarlarındaki adres varsa Google Haritalar." },
    { key: "form", label: "Başvuru formu", hint: "Gelen başvurular \"Bayi Başvuruları\" sayfasına düşer." },
  ];

  return (
    <div>
      <StepIntro title="Görünüm">
        Üst alandaki büyük görseli, vurgu rengini ve sayfada hangi bölümlerin görüneceğini seçin.
      </StepIntro>

      <p className="text-sm font-semibold">Üst alan görseli</p>
      <div className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-5">
        <HeroThumb
          url={ctx.fallbackHero}
          label="Otomatik"
          active={!draft.hero_image_url}
          onClick={() => patch({ hero_image_url: null })}
        />
        {ctx.heroOptions.map((url) => (
          <HeroThumb key={url} url={url} active={draft.hero_image_url === url} onClick={() => patch({ hero_image_url: url })} />
        ))}
      </div>
      <p className="mt-1.5 text-xs text-muted-foreground">
        Liste; banner görsellerinizden, kategori ve ürün fotoğraflarınızdan oluşur. Yeni görsel için Ayarlar → Anasayfa Banner&apos;ı&apos;na
        yükleyin.
      </p>

      <p className="mt-6 text-sm font-semibold">Vurgu rengi</p>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => {
            patch({ accent_color: null });
            setHexInput("");
          }}
          className={cn(
            "inline-flex items-center gap-2 rounded-full border-2 px-3 py-1.5 text-xs font-semibold",
            !draft.accent_color ? "border-emerald-600" : "border-slate-200 dark:border-slate-700",
          )}
        >
          <span className="size-4 rounded-full" style={{ backgroundColor: ctx.fallbackAccent }} /> Otomatik
        </button>
        {ACCENT_SWATCHES.map((color) => (
          <button
            key={color}
            type="button"
            aria-label={color}
            onClick={() => {
              patch({ accent_color: color });
              setHexInput(color);
            }}
            className={cn(
              "size-8 rounded-full border-2 transition",
              draft.accent_color?.toLowerCase() === color.toLowerCase()
                ? "border-foreground ring-2 ring-emerald-300"
                : "border-white shadow dark:border-slate-800",
            )}
            style={{ backgroundColor: color }}
          />
        ))}
        <input
          type="color"
          aria-label="Özel renk"
          value={HEX_RE.test(activeAccent) ? activeAccent : "#0f172a"}
          onChange={(e) => {
            patch({ accent_color: e.target.value });
            setHexInput(e.target.value);
          }}
          className="size-8 cursor-pointer rounded-full border border-slate-200 bg-transparent p-0 dark:border-slate-700"
        />
        <Input
          value={hexInput}
          onChange={(e) => {
            const value = e.target.value.trim();
            setHexInput(value);
            if (HEX_RE.test(value)) patch({ accent_color: value });
          }}
          maxLength={7}
          placeholder="#F58220"
          className="w-28 py-1.5 text-sm"
        />
      </div>

      <p className="mt-6 text-sm font-semibold">Bölümler</p>
      <div className="mt-2 grid gap-2 sm:grid-cols-2">
        {sectionToggles.map((toggle) => {
          const checked = draft.sections[toggle.key];
          return (
            <label
              key={toggle.key}
              className={cn(
                "flex cursor-pointer gap-3 rounded-xl border-2 p-3 transition",
                checked ? "border-emerald-600" : "border-slate-200 dark:border-slate-700",
              )}
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={(e) => patch({ sections: { ...draft.sections, [toggle.key]: e.target.checked } })}
                className="mt-0.5 size-4 accent-emerald-600"
              />
              <span>
                <span className="block text-sm font-semibold">{toggle.label}</span>
                <span className="mt-0.5 block text-xs text-muted-foreground">{toggle.hint}</span>
              </span>
            </label>
          );
        })}
      </div>
    </div>
  );
}

function HeroThumb({
  url,
  label,
  active,
  onClick,
}: {
  url: string | null;
  label?: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "relative aspect-video overflow-hidden rounded-lg border-2 bg-slate-900 transition",
        active ? "border-emerald-600 ring-4 ring-emerald-100 dark:ring-emerald-900" : "border-slate-200 dark:border-slate-700",
      )}
    >
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt="" loading="lazy" className="h-full w-full object-cover" />
      ) : null}
      {label ? (
        <span className="absolute inset-x-0 bottom-0 bg-black/60 px-1 py-0.5 text-center text-[11px] font-semibold text-white">
          {label}
        </span>
      ) : null}
      {active ? (
        <span className="absolute right-1 top-1 flex size-5 items-center justify-center rounded-full bg-emerald-600 text-white">
          <Check className="size-3" strokeWidth={3} />
        </span>
      ) : null}
    </button>
  );
}

/* 7 — Önizle & yayınla */
function PreviewStep({
  draft,
  ctx,
  published,
  justPublished,
}: {
  draft: KurumsalContent;
  ctx: KurumsalWizardContext;
  published: boolean;
  justPublished: boolean;
}) {
  const content = cleanContent(draft);
  return (
    <div>
      <StepIntro title="Önizleyin ve yayınlayın">
        Aşağıda sitenizin küçültülmüş hâli var (önizlemede bağlantılar ve form çalışmaz). Beğendiyseniz &quot;Yayınla&quot;ya basın;
        siteniz Google&apos;a açık olur ve şifre sormaz. Fiyatlarınız yine yalnızca bayi girişinde görünür.
      </StepIntro>

      {!ctx.publicUrl ? (
        <div className="mb-4 rounded-lg bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800 dark:bg-amber-950 dark:text-amber-200">
          Yayınlamak için önce alan adı bağlayın (1. adım: &quot;Alan adı&quot;). O zamana kadar siteniz taslak olarak kaydedilir ve
          kimseye görünmez.
        </div>
      ) : null}
      {(justPublished || published) && ctx.publicUrl ? (
        <div className="mb-4 flex flex-col gap-2 rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-800 sm:flex-row sm:items-center sm:justify-between dark:bg-emerald-950 dark:text-emerald-200">
          <span className="font-semibold">{justPublished ? "Siteniz yayında!" : "Siteniz şu an yayında."}</span>
          <a
            href={ctx.publicUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 break-all font-semibold underline underline-offset-4"
          >
            {ctx.publicUrl} <ExternalLink className="size-3.5 shrink-0" />
          </a>
        </div>
      ) : null}

      <ScaledPreview>
        <KurumsalView
          tenantName={ctx.tenantName}
          subdomain={ctx.subdomain}
          logoUrl={ctx.logoUrl}
          wordmark={ctx.wordmark}
          accent={content.accent_color ?? ctx.fallbackAccent}
          heroImage={content.hero_image_url ?? ctx.fallbackHero}
          content={content}
          contact={ctx.contact}
          data={ctx.data}
          isWhiteLabel={ctx.isWhiteLabel}
          catalogUrl={ctx.catalogUrl}
          preview
        />
      </ScaledPreview>
    </div>
  );
}

// Sayfayı gerçek genişliğinde (masaüstünde 1200px, telefonda 390px) çizip
// kutuya sığacak şekilde küçültür. Tıklamalar yakalanır: önizlemede
// bağlantılar "#" olsa da sayfa kaymasın.
function ScaledPreview({ children }: { children: React.ReactNode }) {
  const outerRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(1200);
  const [scale, setScale] = useState(0.5);
  const [height, setHeight] = useState<number | undefined>(undefined);

  useEffect(() => {
    const outer = outerRef.current;
    const inner = innerRef.current;
    if (!outer || !inner) return;
    const measure = () => {
      const pageWidth = window.innerWidth >= 768 ? 1200 : 390;
      const nextScale = Math.min(1, outer.clientWidth / pageWidth);
      setWidth(pageWidth);
      setScale(nextScale);
      setHeight(inner.offsetHeight * nextScale);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(outer);
    observer.observe(inner);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={outerRef}
      className="max-h-[60dvh] overflow-y-auto overflow-x-hidden rounded-xl border border-slate-200 bg-white shadow-inner dark:border-slate-700"
      onClickCapture={(event) => {
        if ((event.target as HTMLElement).closest("a, button[type='submit']")) event.preventDefault();
      }}
    >
      <div style={{ height }}>
        <div ref={innerRef} style={{ width, transform: `scale(${scale})`, transformOrigin: "top left" }}>
          {children}
        </div>
      </div>
    </div>
  );
}
