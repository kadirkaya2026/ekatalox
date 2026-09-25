"use client";

// Kurulum sihirbazı + Genel Bakış ilerleme kartı (21 Eyl 2026).
// Yeni tenant ilk girişte modal olarak karşılanır (status.autoOpen); her
// adımda kısa açıklama + o işi yapan küçük form var, istenirse "Atla" ile
// geçilir, "Şimdi değil" ile tamamen kapatılır (POST /api/tenant/onboarding
// → tenants.onboarding_dismissed_at). Kapatılsa da adımlar tamamlanana kadar
// "Kurulumu tamamla · %X" kartı Genel Bakış'ta kalır ve sihirbazı yeniden
// açar. Tamamlanma durumu sunucuda gerçek verilerden hesaplanır
// (lib/onboarding/status.ts); burada yalnız yapılan işlem sonrası yerel
// olarak işaretlenir, kapanışta router.refresh() ile sunucu doğrular.
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  Circle,
  Copy,
  ExternalLink,
  FileSpreadsheet,
  ImagePlus,
  Loader2,
  MessageCircle,
  PlusCircle,
  Sparkles,
  Upload,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { OnboardingStatus, OnboardingStep, OnboardingStepId, OnboardingThemePreset } from "@/lib/onboarding/status";
import { cn } from "@/lib/utils";

const SALES_WHATSAPP = "905354172510";

type Done = Partial<Record<OnboardingStepId, boolean>>;

function localKey(tenantId: string) {
  return `ekatalox-onboarding-dismissed:${tenantId}`;
}

function readLocalDismissed(tenantId: string) {
  try {
    return localStorage.getItem(localKey(tenantId)) === "1";
  } catch {
    return false;
  }
}

function writeLocalDismissed(tenantId: string) {
  try {
    localStorage.setItem(localKey(tenantId), "1");
  } catch {
    // özel pencere vb.
  }
}

async function readJson(res: Response) {
  return (await res.json().catch(() => null)) as Record<string, unknown> | null;
}

export function OnboardingWizard({
  status,
  presets,
  tenantId,
  forceOpen = false,
}: {
  status: OnboardingStatus;
  presets: OnboardingThemePreset[];
  tenantId: string;
  // Ayarlar → "Sihirbazı baştan başlat" (?sihirbaz=1): kurulum tamamlanmış
  // ya da daha önce kapatılmış olsa da 1. adımdan açılır.
  forceOpen?: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  // Her açılışta modal sıfırdan kurulsun (ilk eksik adımdan başlar).
  const [session, setSession] = useState(0);
  const [fromStart, setFromStart] = useState(forceOpen);
  const [done, setDone] = useState<Done>(() =>
    Object.fromEntries(status.steps.map((s) => [s.id, s.completed])) as Done,
  );

  // İlk giriş: sunucu "aç" dediyse ve bu tarayıcıda daha önce kapatılmadıysa.
  useEffect(() => {
    if (forceOpen) {
      // Yeniden başlatma: yerel "kapatıldı" izi silinir, adres temizlenir.
      try {
        localStorage.removeItem(localKey(tenantId));
      } catch {
        /* özel pencere vb. */
      }
      const raf = requestAnimationFrame(() => setOpen(true));
      window.history.replaceState(null, "", window.location.pathname);
      return () => cancelAnimationFrame(raf);
    }
    if (!status.autoOpen || readLocalDismissed(tenantId)) return;
    const raf = requestAnimationFrame(() => setOpen(true));
    return () => cancelAnimationFrame(raf);
    // yalnız ilk render
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function openWizard() {
    setSession((n) => n + 1);
    setFromStart(false);
    setOpen(true);
  }

  const steps = status.steps;
  const measurable = steps.filter((s) => s.id !== "share");
  const completedCount = measurable.filter((s) => done[s.id]).length;
  const percent = measurable.length ? Math.round((completedCount / measurable.length) * 100) : 100;
  const allDone = completedCount === measurable.length;

  function markDone(id: OnboardingStepId) {
    setDone((d) => ({ ...d, [id]: true }));
  }

  async function dismiss() {
    setOpen(false);
    writeLocalDismissed(tenantId);
    try {
      await fetch("/api/tenant/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "dismiss" }),
      });
    } catch {
      // localStorage yedeği yeter
    }
    router.refresh();
  }

  return (
    <>
      {allDone ? null : (
        <ProgressCard
          steps={steps}
          done={done}
          percent={percent}
          completedCount={completedCount}
          total={measurable.length}
          onOpen={openWizard}
        />
      )}
      <WizardModal
        key={session}
        open={open}
        steps={steps}
        done={done}
        data={status.data}
        presets={presets}
        tenantId={tenantId}
        percent={percent}
        startAtFirst={fromStart}
        onDone={markDone}
        onDismiss={dismiss}
      />
    </>
  );
}

/* ───────────────────────── Genel Bakış kartı ───────────────────────── */

function ProgressCard({
  steps,
  done,
  percent,
  completedCount,
  total,
  onOpen,
}: {
  steps: OnboardingStep[];
  done: Done;
  percent: number;
  completedCount: number;
  total: number;
  onOpen: () => void;
}) {
  const next = steps.find((s) => s.id !== "share" && !done[s.id]);
  return (
    <Card className="border-emerald-200 bg-emerald-50/60 p-5 dark:border-emerald-900 dark:bg-emerald-950/30">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <p className="text-base font-semibold text-emerald-900 dark:text-emerald-100">Kurulumu tamamla</p>
            <span className="rounded-full bg-emerald-600 px-2.5 py-0.5 text-xs font-bold text-white">%{percent} tamamlandı</span>
            <span className="text-xs text-emerald-800/80 dark:text-emerald-200/80">
              {completedCount}/{total} adım
            </span>
          </div>
          <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-emerald-100 dark:bg-emerald-900">
            <div className="h-full rounded-full bg-emerald-600 transition-all" style={{ width: `${percent}%` }} />
          </div>
          <ul className="mt-4 grid gap-x-6 gap-y-1.5 sm:grid-cols-2 lg:grid-cols-3">
            {steps
              .filter((s) => s.id !== "share")
              .map((s) => (
                <li key={s.id} className="flex items-center gap-2 text-sm">
                  {done[s.id] ? (
                    <CheckCircle2 className="size-4 shrink-0 text-emerald-600" />
                  ) : (
                    <Circle className="size-4 shrink-0 text-slate-300 dark:text-slate-600" />
                  )}
                  <span className={cn(done[s.id] ? "text-slate-500 line-through" : "font-medium text-slate-900 dark:text-slate-100")}>
                    {s.title}
                  </span>
                </li>
              ))}
          </ul>
        </div>
        <div className="shrink-0">
          <Button onClick={onOpen} className="w-full lg:w-auto">
            {next ? `Devam et: ${next.title}` : "Sihirbazı aç"} <ArrowRight className="size-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
}

/* ───────────────────────── Sihirbaz modalı ───────────────────────── */

function WizardModal({
  open,
  steps,
  done,
  data,
  presets,
  tenantId,
  percent,
  startAtFirst = false,
  onDone,
  onDismiss,
}: {
  open: boolean;
  steps: OnboardingStep[];
  done: Done;
  data: OnboardingStatus["data"];
  presets: OnboardingThemePreset[];
  tenantId: string;
  percent: number;
  // Baştan başlatmada tamamlanmış adımlar atlanmaz, 1. adımdan gidilir.
  startAtFirst?: boolean;
  onDone: (id: OnboardingStepId) => void;
  onDismiss: () => void;
}) {
  const firstIncomplete = startAtFirst
    ? 0
    : Math.max(
        0,
        steps.findIndex((s) => !done[s.id]),
      );
  const [index, setIndex] = useState(firstIncomplete);
  const bodyRef = useRef<HTMLDivElement>(null);

  const step = steps[index];
  const isLast = index === steps.length - 1;

  function go(next: number) {
    setIndex(Math.min(Math.max(next, 0), steps.length - 1));
    bodyRef.current?.scrollTo({ top: 0 });
  }

  return (
    <Modal
      open={open}
      onClose={onDismiss}
      title="Kataloğunuzu kuralım"
      sheet
      panelClassName="max-w-3xl"
      bodyClassName="p-0"
      contentScroll={false}
    >
      <div className="flex min-h-0 flex-1 flex-col">
        {/* adım çubuğu */}
        <div className="shrink-0 border-b border-slate-100 px-4 py-3 sm:px-6 dark:border-slate-800">
          <ol className="flex items-center gap-1.5 overflow-x-auto">
            {steps.map((s, i) => {
              const isDone = Boolean(done[s.id]);
              const active = i === index;
              return (
                <li key={s.id} className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => go(i)}
                    aria-current={active ? "step" : undefined}
                    title={s.title}
                    className={cn(
                      "flex size-7 shrink-0 items-center justify-center rounded-full border-2 text-xs font-bold transition",
                      active
                        ? "border-emerald-600 bg-emerald-600 text-white ring-4 ring-emerald-100 dark:ring-emerald-900"
                        : isDone
                          ? "border-emerald-600 bg-emerald-600 text-white"
                          : "border-slate-200 bg-card text-slate-400 dark:border-slate-700",
                    )}
                  >
                    {isDone && !active ? <Check className="size-3.5" strokeWidth={3} /> : i + 1}
                  </button>
                  {i < steps.length - 1 ? (
                    <span
                      className={cn("h-0.5 w-4 shrink-0 rounded-full sm:w-7", isDone ? "bg-emerald-500" : "bg-slate-200 dark:bg-slate-700")}
                    />
                  ) : null}
                </li>
              );
            })}
          </ol>
          <div className="mt-2 flex items-center justify-between gap-3 text-xs">
            <span className="font-semibold text-emerald-700 dark:text-emerald-400">
              Adım {index + 1}/{steps.length} · {step.title}
            </span>
            <span className="text-muted-foreground">%{percent} tamamlandı</span>
          </div>
        </div>

        {/* adım içeriği */}
        <div ref={bodyRef} className="min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-6">
          <StepBody
            key={step.id}
            step={step}
            data={data}
            presets={presets}
            tenantId={tenantId}
            isDone={Boolean(done[step.id])}
            onDone={() => onDone(step.id)}
            onNext={() => go(index + 1)}
            onFinish={onDismiss}
          />
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
                Atla
              </Button>
            )}
            <button
              type="button"
              onClick={onDismiss}
              className="text-xs text-muted-foreground underline underline-offset-4 hover:text-foreground"
            >
              Şimdi değil
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}

/* ───────────────────────── Adım gövdeleri ───────────────────────── */

type StepProps = {
  step: OnboardingStep;
  data: OnboardingStatus["data"];
  presets: OnboardingThemePreset[];
  tenantId: string;
  isDone: boolean;
  onDone: () => void;
  onNext: () => void;
  onFinish: () => void;
};

function StepBody(props: StepProps) {
  switch (props.step.id) {
    case "identity":
      return <IdentityStep {...props} />;
    case "logo":
      return <LogoStep {...props} />;
    case "theme":
      return <ThemeStep {...props} />;
    case "banner":
      return <BannerStep {...props} />;
    case "categories":
      return <CategoriesStep {...props} />;
    case "products":
      return <ProductsStep {...props} />;
    case "access_code":
      return <AccessCodeStep {...props} />;
    case "share":
      return <ShareStep {...props} />;
  }
}

function StepIntro({ title, children, done }: { title: string; children: React.ReactNode; done?: boolean }) {
  return (
    <div className="mb-5">
      <div className="flex flex-wrap items-center gap-2">
        <h4 className="text-xl font-semibold text-foreground">{title}</h4>
        {done ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200">
            <Check className="size-3" /> Tamamlandı
          </span>
        ) : null}
      </div>
      <p className="mt-1.5 text-sm leading-6 text-muted-foreground">{children}</p>
    </div>
  );
}

function ErrorLine({ message }: { message: string | null }) {
  return message ? (
    <p className="mt-2 text-sm text-rose-600" role="alert">
      {message}
    </p>
  ) : null;
}

function NextButton({ onClick, label = "Devam et", disabled }: { onClick: () => void; label?: string; disabled?: boolean }) {
  return (
    <Button onClick={onClick} disabled={disabled}>
      {label} <ArrowRight className="size-4" />
    </Button>
  );
}

const DONE_NOTE = "rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200";

/* 1 — Mağaza adı ve tanıtım */
function IdentityStep({ data, isDone, onDone, onNext }: StepProps) {
  const [title, setTitle] = useState(data.storefrontTitle);
  const [description, setDescription] = useState(data.storefrontDescription);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    setError(null);
    if (!title.trim()) return setError("Mağaza adı boş olamaz.");
    if (title.length > 80) return setError("Mağaza adı en fazla 80 karakter olabilir.");
    if (!description.trim()) return setError("Kısa bir tanıtım cümlesi yazın; bayileriniz kataloğu açınca bunu görür.");
    if (description.length > 220) return setError("Tanıtım en fazla 220 karakter olabilir.");
    setPending(true);
    try {
      const res = await fetch("/api/tenant/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ storefront_title: title.trim(), storefront_description: description.trim() }),
      });
      const result = await readJson(res);
      if (!res.ok) return setError((result?.error as string) ?? "Kaydedilemedi.");
      onDone();
      onNext();
    } catch {
      setError("Bağlantı kurulamadı.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div>
      <StepIntro title="Mağazanızın adı ne olsun?" done={isDone}>
        Bu ad kataloğun üst barında ve tarayıcı sekmesinde görünür. Tanıtım cümlesi ana sayfada adın altında yer alır; ne sattığınızı
        bir cümlede söyleyin (örn. &quot;İstanbul&apos;dan tüm Türkiye&apos;ye toptan telefon aksesuarı&quot;).
      </StepIntro>
      <div className="space-y-4">
        <label className="block">
          <span className="text-sm font-semibold">Mağaza adı</span>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={80} className="mt-1.5" placeholder="Örn. Yıldız Toptan" />
        </label>
        <label className="block">
          <span className="text-sm font-semibold">Tanıtım cümlesi</span>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={220}
            className="mt-1.5 min-h-24"
            placeholder="Örn. 2005'ten beri toptan gıda ve içecek. Bayilerimize aynı gün sevkiyat."
          />
          <span className="mt-1 block text-right text-xs text-muted-foreground">{description.length}/220</span>
        </label>
      </div>
      <ErrorLine message={error} />
      <div className="mt-5 flex justify-end">
        <Button onClick={save} disabled={pending}>
          {pending ? <Loader2 className="size-4 animate-spin" /> : null} Kaydet ve devam et <ArrowRight className="size-4" />
        </Button>
      </div>
    </div>
  );
}

/* 2 — Logo */
function LogoStep({ data, isDone, onDone, onNext }: StepProps) {
  const [logoUrl, setLogoUrl] = useState<string | null>(data.logoUrl);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function upload(file: File) {
    setError(null);
    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) return setError("Logo yalnız PNG, JPEG veya WEBP olabilir.");
    if (file.size > 1024 * 1024) return setError("Logo en fazla 1 MB olabilir.");
    setPending(true);
    try {
      const fd = new FormData();
      fd.set("logo", file);
      const res = await fetch("/api/tenant/settings/logo", { method: "POST", body: fd });
      const result = await readJson(res);
      if (!res.ok) return setError((result?.error as string) ?? "Logo yüklenemedi.");
      const url = (result?.storefrontSettings as { logo_url?: string } | undefined)?.logo_url ?? null;
      setLogoUrl(url);
      onDone();
    } catch {
      setError("Bağlantı kurulamadı.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div>
      <StepIntro title="Logonuzu yükleyin" done={isDone || Boolean(logoUrl)}>
        Logo kataloğun üst barında, bayi şifre ekranında ve telefonda ana ekrana eklenince uygulama ikonu olarak görünür. Kare ya da
        yatay, arka planı şeffaf PNG en iyi sonucu verir (en fazla 1 MB).
      </StepIntro>
      <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
        <div className="flex size-28 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-dashed border-slate-300 bg-muted dark:border-slate-700">
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logoUrl} alt="Logo" className="max-h-full max-w-full object-contain p-2" />
          ) : (
            <ImagePlus className="size-8 text-slate-400" />
          )}
        </div>
        <div>
          <input
            ref={inputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              e.target.value = "";
              if (f) void upload(f);
            }}
          />
          <Button variant="secondary" onClick={() => inputRef.current?.click()} disabled={pending}>
            {pending ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />} {logoUrl ? "Logoyu değiştir" : "Dosya seç"}
          </Button>
          <p className="mt-2 text-xs text-muted-foreground">
            Logonuz elinizde yoksa şimdilik atlayın; sonra Ayarlar &gt; Mağaza kimliği&apos;nden ekleyebilirsiniz.
          </p>
        </div>
      </div>
      <ErrorLine message={error} />
      <div className="mt-5 flex justify-end">
        <NextButton onClick={onNext} disabled={pending} />
      </div>
    </div>
  );
}

/* 3 — Tema */
function ThemeStep({ data, presets, isDone, onDone, onNext }: StepProps) {
  const [applyingKey, setApplyingKey] = useState<string | null>(null);
  const [appliedKey, setAppliedKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const current = useMemo(
    () => presets.find((p) => p.settings.theme_key === data.themeKey && p.settings.layout_key === data.layoutKey)?.key ?? null,
    [presets, data.themeKey, data.layoutKey],
  );
  const selected = appliedKey ?? current;

  async function apply(preset: OnboardingThemePreset) {
    setError(null);
    setApplyingKey(preset.key);
    try {
      const payload = {
        theme_key: preset.settings.theme_key,
        layout_key: preset.settings.layout_key,
        // Marka renkleri (brand_primary/accent_color, brand_palette) gönderilmez:
        // tema seçmek tenant'ın renklerini sıfırlamamalı (25 Eyl 2026).
        ...(data.canUseAdvancedAppearance
          ? {
              font_key: preset.settings.font_key,
              product_card_style: preset.settings.product_card_style,
              header_style_key: preset.settings.header_style_key,
              footer_style_key: preset.settings.footer_style_key,
              hero_style_key: preset.settings.hero_style_key,
            }
          : {}),
      };
      const res = await fetch("/api/tenant/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await readJson(res);
      if (!res.ok) return setError((result?.error as string) ?? "Tema uygulanamadı.");
      setAppliedKey(preset.key);
      onDone();
    } catch {
      setError("Bağlantı kurulamadı.");
    } finally {
      setApplyingKey(null);
    }
  }

  return (
    <div>
      <StepIntro title="Bir tema seçin" done={isDone || Boolean(appliedKey)}>
        Tema; renkleri, ürün kartlarını ve ana sayfa düzenini belirler. Sektörünüze en yakın paketi seçin, tek tıkla uygulanır.
        Renkleri ve ayrıntıları sonra Ayarlar &gt; Tema&apos;dan değiştirebilirsiniz.
      </StepIntro>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {presets.map((p) => {
          const active = selected === p.key;
          const busy = applyingKey === p.key;
          return (
            <button
              key={p.key}
              type="button"
              onClick={() => apply(p)}
              disabled={applyingKey !== null}
              className={cn(
                "group relative overflow-hidden rounded-xl border-2 bg-card text-left transition",
                active
                  ? "border-emerald-600 ring-4 ring-emerald-100 dark:ring-emerald-900"
                  : "border-slate-200 hover:border-emerald-300 dark:border-slate-700",
              )}
            >
              <div className="relative aspect-[3/4] w-full bg-muted">
                <Image src={p.thumbnailMobile} alt={p.title} fill sizes="(max-width: 640px) 45vw, 200px" className="object-cover object-top" />
                {busy ? (
                  <div className="absolute inset-0 flex items-center justify-center bg-white/70">
                    <Loader2 className="size-6 animate-spin text-emerald-600" />
                  </div>
                ) : null}
                {active && !busy ? (
                  <span className="absolute right-2 top-2 flex size-6 items-center justify-center rounded-full bg-emerald-600 text-white">
                    <Check className="size-3.5" strokeWidth={3} />
                  </span>
                ) : null}
              </div>
              <div className="px-2.5 py-2">
                <p className="text-sm font-semibold leading-tight">{p.title}</p>
              </div>
            </button>
          );
        })}
      </div>
      <ErrorLine message={error} />
      <div className="mt-5 flex justify-end">
        <NextButton onClick={onNext} disabled={applyingKey !== null} />
      </div>
    </div>
  );
}

/* 4 — Banner */
function BannerStep({ isDone, onDone, onNext }: StepProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(isDone);
  const inputRef = useRef<HTMLInputElement>(null);

  async function upload(file: File) {
    setError(null);
    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) return setError("Banner yalnız PNG, JPEG veya WEBP olabilir.");
    if (file.size > 2 * 1024 * 1024) return setError("Banner en fazla 2 MB olabilir.");
    setPending(true);
    try {
      const fd = new FormData();
      fd.set("image", file);
      const up = await fetch("/api/tenant/settings/banner-image", { method: "POST", body: fd });
      const upResult = await readJson(up);
      if (!up.ok) return setError((upResult?.error as string) ?? "Görsel yüklenemedi.");
      const imageUrl = upResult?.image_url as string;
      const res = await fetch("/api/tenant/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          banner_items: [
            {
              id: `banner-${Date.now()}`,
              title: null,
              description: null,
              image_url: imageUrl,
              cta_label: null,
              cta_href: null,
              background_color: null,
              is_visible_on_mobile: true,
            },
          ],
        }),
      });
      const result = await readJson(res);
      if (!res.ok) return setError((result?.error as string) ?? "Banner kaydedilemedi.");
      setPreview(imageUrl);
      setSaved(true);
      onDone();
    } catch {
      setError("Bağlantı kurulamadı.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div>
      <StepIntro title="Bir banner ekleyin" done={saved}>
        Banner ana sayfanın en üstündeki geniş görseldir: kampanya, yeni sezon ya da markanızı anlatan bir görsel koyun. Yatay
        (örn. 1600×600 piksel) bir görsel en iyi durur; en fazla 2 MB.
      </StepIntro>
      {saved && !preview ? (
        <p className={DONE_NOTE}>
          Banneriniz var. Eklemek/değiştirmek için{" "}
          <Link href="/settings/banner" className="font-semibold underline underline-offset-4">
            Banner ayarları
          </Link>
          .
        </p>
      ) : (
        <div>
          <input
            ref={inputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              e.target.value = "";
              if (f) void upload(f);
            }}
          />
          {preview ? (
            <div className="relative aspect-[8/3] w-full overflow-hidden rounded-xl bg-muted">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={preview} alt="Banner" className="size-full object-cover" />
            </div>
          ) : (
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={pending}
              className="flex aspect-[8/3] w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-300 bg-muted text-sm text-muted-foreground transition hover:border-emerald-400 hover:text-foreground dark:border-slate-700"
            >
              {pending ? <Loader2 className="size-6 animate-spin text-emerald-600" /> : <ImagePlus className="size-7" />}
              {pending ? "Yükleniyor…" : "Görsel seçmek için tıklayın"}
            </button>
          )}
          <p className="mt-2 text-xs text-muted-foreground">
            Birden çok banner, başlık ve buton eklemek için{" "}
            <Link href="/settings/banner" className="font-semibold underline underline-offset-4">
              Banner ayarları
            </Link>
            .
          </p>
        </div>
      )}
      <ErrorLine message={error} />
      <div className="mt-5 flex justify-end">
        <NextButton onClick={onNext} disabled={pending} />
      </div>
    </div>
  );
}

/* 5 — Kategoriler */
function CategoriesStep({ data, tenantId, isDone, onDone, onNext }: StepProps) {
  const [names, setNames] = useState<string[]>(data.categoryNames);
  const [value, setValue] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function add() {
    const name = value.trim();
    if (!name) return;
    setError(null);
    setPending(true);
    try {
      const res = await fetch("/api/tenant/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenant_id: tenantId, parent_id: null, name }),
      });
      const result = await readJson(res);
      if (!res.ok) return setError((result?.error as string) ?? "Kategori eklenemedi.");
      setNames((n) => [...n, name]);
      setValue("");
      onDone();
    } catch {
      setError("Bağlantı kurulamadı.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div>
      <StepIntro title="Kategorilerinizi ekleyin" done={isDone || names.length > 0}>
        Kategoriler kataloğun üstünde sekme olarak görünür; bayiler &quot;Şarj Kablosu&quot;, &quot;Kulaklık&quot; gibi başlıklara
        tıklayıp ürünü hızlı bulur. Ana başlıkları yazıp Enter&apos;a basın; alt kategorileri sonra Kategoriler sayfasından açarsınız.
      </StepIntro>
      <div className="flex gap-2">
        <Input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              void add();
            }
          }}
          placeholder="Örn. Şarj Kablosu"
          disabled={pending}
        />
        <Button onClick={add} disabled={pending || !value.trim()} className="shrink-0">
          {pending ? <Loader2 className="size-4 animate-spin" /> : <PlusCircle className="size-4" />} Ekle
        </Button>
      </div>
      {names.length ? (
        <ul className="mt-3 flex flex-wrap gap-2">
          {names.map((n, i) => (
            <li
              key={`${n}-${i}`}
              className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-sm font-medium text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200"
            >
              <Check className="size-3.5" /> {n}
            </li>
          ))}
        </ul>
      ) : null}
      <ErrorLine message={error} />
      <div className="mt-5 flex justify-end">
        <NextButton onClick={onNext} disabled={pending} />
      </div>
    </div>
  );
}

/* 6 — Ürünler */
function ProductsStep({ data, isDone, onNext }: StepProps) {
  const options = [
    {
      href: "/products/bulk",
      icon: FileSpreadsheet,
      title: "Excel ile toplu yükle",
      text: "Şablonu indirin, ürünleri doldurun, tek seferde yükleyin. En hızlı yol.",
      external: false,
    },
    {
      href: "/products/add",
      icon: PlusCircle,
      title: "Tek tek ekle",
      text: "Az ürününüz varsa ad, fiyat, görsel girerek ekleyin.",
      external: false,
    },
    {
      href: `https://wa.me/${SALES_WHATSAPP}?text=${encodeURIComponent("Merhaba, katalog dosyamı gönderiyorum; eKatalox'a yüklenmesini istiyorum.")}`,
      icon: MessageCircle,
      title: "PDF/Excel'inizi bize gönderin",
      text: "Mevcut kataloğunuzu WhatsApp'tan atın, biz yükleyelim.",
      external: true,
    },
  ];
  const cls =
    "flex flex-col rounded-xl border border-slate-200 bg-card p-4 text-left transition hover:border-emerald-400 hover:shadow-sm dark:border-slate-700";
  return (
    <div>
      <StepIntro title="Ürünlerinizi yükleyin" done={isDone || data.productCount > 0}>
        Katalog ürünsüz boş görünür. Üç yol var; hangisi kolayınıza geliyorsa onu seçin. Ürün sayfasına gidince bu pencere kapanır,
        Genel Bakış&apos;a dönünce kaldığınız yerden devam edersiniz.
      </StepIntro>
      {data.productCount > 0 ? (
        <p className={cn(DONE_NOTE, "mb-4")}>
          Katalogda <strong>{data.productCount}</strong> ürün var.
        </p>
      ) : null}
      <div className="grid gap-3 sm:grid-cols-3">
        {options.map((o) => {
          const Icon = o.icon;
          const inner = (
            <>
              <Icon className="size-6 text-emerald-600" />
              <p className="mt-3 text-sm font-semibold">{o.title}</p>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">{o.text}</p>
            </>
          );
          return o.external ? (
            <a key={o.href} href={o.href} target="_blank" rel="noopener noreferrer" className={cls}>
              {inner}
            </a>
          ) : (
            <Link key={o.href} href={o.href} className={cls}>
              {inner}
            </Link>
          );
        })}
      </div>
      <div className="mt-5 flex justify-end">
        <NextButton onClick={onNext} />
      </div>
    </div>
  );
}

/* 7 — Bayi şifresi */
function AccessCodeStep({ data, isDone, onDone, onNext }: StepProps) {
  const [code, setCode] = useState("");
  const [priceListId, setPriceListId] = useState(data.pricedPriceLists[0]?.id ?? "");
  const [created, setCreated] = useState<string[]>([]);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function add() {
    setError(null);
    if (code.trim().length < 3) return setError("Şifre en az 3 karakter olmalı.");
    if (!priceListId) return setError("Fiyat listesi bulunamadı; Şifreler sayfasından ekleyin.");
    setPending(true);
    try {
      const res = await fetch("/api/tenant/access-codes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password_code: code.trim(), price_list_id: priceListId }),
      });
      const result = await readJson(res);
      if (!res.ok) return setError((result?.error as string) ?? "Şifre eklenemedi.");
      setCreated((c) => [...c, code.trim()]);
      setCode("");
      onDone();
    } catch {
      setError("Bağlantı kurulamadı.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div>
      <StepIntro title="Bayi şifresi belirleyin" done={isDone || created.length > 0}>
        Kataloğunuz şifre korumalı: bayi adresi açınca şifre girer, ona tanımlı fiyat listesini görür. Herkese ortak tek şifre
        verebilir ya da bayi/grup başına ayrı şifre açabilirsiniz (her şifre farklı fiyat listesine bağlanabilir).
      </StepIntro>
      {data.accessCodeCount > 0 && created.length === 0 ? (
        <p className={cn(DONE_NOTE, "mb-4")}>
          Tanımlı <strong>{data.accessCodeCount}</strong> şifreniz var. Yeni eklemek için aşağıyı kullanın.
        </p>
      ) : null}
      <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
        <label className="block">
          <span className="text-sm font-semibold">Şifre</span>
          <Input value={code} onChange={(e) => setCode(e.target.value)} placeholder="Örn. bayi2026" className="mt-1.5 font-mono" disabled={pending} />
        </label>
        <label className="block">
          <span className="text-sm font-semibold">Fiyat listesi</span>
          <Select value={priceListId} onChange={(e) => setPriceListId(e.target.value)} className="mt-1.5" disabled={pending}>
            {data.pricedPriceLists.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </Select>
        </label>
        <div className="flex items-end">
          <Button onClick={add} disabled={pending} className="w-full sm:w-auto">
            {pending ? <Loader2 className="size-4 animate-spin" /> : <PlusCircle className="size-4" />} Ekle
          </Button>
        </div>
      </div>
      {created.length ? (
        <ul className="mt-3 flex flex-wrap gap-2">
          {created.map((c) => (
            <li
              key={c}
              className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 font-mono text-sm text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200"
            >
              <Check className="size-3.5" /> {c}
            </li>
          ))}
        </ul>
      ) : null}
      <ErrorLine message={error} />
      <div className="mt-5 flex justify-end">
        <NextButton onClick={onNext} disabled={pending} />
      </div>
    </div>
  );
}

/* 8 — Paylaş & bitir */
function ShareStep({ data, onFinish }: StepProps) {
  const [copied, setCopied] = useState(false);
  const shareText = `Merhaba, yeni online kataloğumuz açıldı: ${data.storeUrl}${
    data.isPasswordProtected ? " — şifrenizi bizden isteyebilirsiniz." : ""
  }`;

  async function copy() {
    try {
      await navigator.clipboard.writeText(data.storeUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // izin yoksa sessiz geç
    }
  }

  return (
    <div>
      <StepIntro title="Kataloğunuz hazır, bayilerinize gönderin">
        Linki WhatsApp gruplarınıza ya da tek tek bayilerinize atın. Bayi linke tıklar,{" "}
        {data.isPasswordProtected ? "şifresini girer, " : ""}sepetini doldurur; sipariş fişi WhatsApp numaranıza düşer.
      </StepIntro>
      <div className="flex flex-col gap-2 rounded-xl border border-slate-200 bg-muted p-3 sm:flex-row sm:items-center dark:border-slate-700">
        <code className="flex-1 truncate px-2 text-sm font-semibold">{data.storeUrl.replace(/^https?:\/\//, "")}</code>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={copy} className="shrink-0">
            {copied ? <Check className="size-4 text-emerald-600" /> : <Copy className="size-4" />} {copied ? "Kopyalandı" : "Kopyala"}
          </Button>
          <a
            href={data.storeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-slate-200 bg-card px-4 py-3 text-sm font-semibold hover:bg-muted dark:border-slate-700"
          >
            <ExternalLink className="size-4" /> Aç
          </a>
        </div>
      </div>
      <a
        href={`https://wa.me/?text=${encodeURIComponent(shareText)}`}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-3 inline-flex items-center gap-2 rounded-lg bg-[#25D366] px-4 py-3 text-sm font-semibold text-white hover:bg-[#1ebe5b]"
      >
        <MessageCircle className="size-4" /> WhatsApp&apos;tan paylaş
      </a>
      <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-100">
        <p className="flex items-center gap-2 font-semibold">
          <Sparkles className="size-4" /> Sırada ne var
        </p>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>Siparişler panelde &quot;Siparişler&quot; altında da birikir; WhatsApp&apos;ı kaçırsanız da buradan görürsünüz.</li>
          <li>Eksik adımları Genel Bakış&apos;taki &quot;Kurulumu tamamla&quot; kartından istediğiniz zaman bitirebilirsiniz.</li>
        </ul>
      </div>
      <div className="mt-5 flex justify-end">
        <Button onClick={onFinish}>
          <Check className="size-4" /> Bitir
        </Button>
      </div>
    </div>
  );
}
