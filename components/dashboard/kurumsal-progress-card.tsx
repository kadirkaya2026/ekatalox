import Link from "next/link";
import { ArrowRight, Building2, CheckCircle2, Circle, Lock } from "lucide-react";
import { Card } from "@/components/ui/card";
import type { KurumsalSiteRecord } from "@/lib/kurumsal/schema";
import { cn } from "@/lib/utils";

// Genel Bakış → "Kurumsal sitenizi kurun" kartı. Katalog kurulum kartının
// altında, ondan daha sade (ikincil) durur. İlerleme gerçek veriden:
// alan adı bağlı, unvan, başlık+slogan, hakkımızda, en az 1 özellik, yayında.
// Paket kapsamıyorsa kilitli küçük kart (Ayarlar → Kurumsal Site'deki
// yükseltme kartına gider). Market tenant'larda hiç gösterilmez (çağıran
// taraf); %100 ve yayındaysa kaybolur.

export function getKurumsalProgress(site: KurumsalSiteRecord | null, kurumsalDomain: string | null | undefined) {
  const content = site?.content;
  const steps = [
    { id: "domain", title: "Alan adını bağla", done: Boolean(kurumsalDomain) },
    { id: "company", title: "Firma bilgileri", done: Boolean(content?.legal_name?.trim()) },
    { id: "headline", title: "Başlık ve slogan", done: Boolean(content?.headline.trim() && content?.tagline.trim()) },
    { id: "about", title: "Hakkımızda", done: Boolean(content?.about.some((p) => p.trim())) },
    { id: "highlights", title: "Neden biz", done: Boolean(content?.highlights.length) },
    { id: "publish", title: "Yayınla", done: Boolean(site?.is_published && kurumsalDomain) },
  ];
  const completed = steps.filter((step) => step.done).length;
  return { steps, completed, percent: Math.round((completed / steps.length) * 100) };
}

export function KurumsalProgressCard({
  entitled,
  site,
  kurumsalDomain,
}: {
  entitled: boolean;
  site: KurumsalSiteRecord | null;
  kurumsalDomain: string | null | undefined;
}) {
  if (!entitled) {
    return (
      <Link
        href="/settings/kurumsal"
        className="flex items-center gap-3 rounded-xl border border-dashed border-slate-300 bg-card px-4 py-3 text-sm transition hover:border-emerald-300 dark:border-slate-700"
      >
        <Lock className="size-4 shrink-0 text-amber-600" />
        <span className="min-w-0 flex-1">
          <span className="font-semibold">Kurumsal site en üst pakette</span>
          <span className="text-muted-foreground"> — kendi alan adınızda tanıtım sitesi ve bayi başvuru formu.</span>
        </span>
        <span className="shrink-0 font-semibold text-emerald-700 dark:text-emerald-400">Paketi yükselt →</span>
      </Link>
    );
  }

  const { steps, completed, percent } = getKurumsalProgress(site, kurumsalDomain);
  if (completed === steps.length) return null;
  const next = steps.find((step) => !step.done);

  return (
    <Card className="p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <Building2 className="size-4 text-emerald-700 dark:text-emerald-400" />
            <p className="text-base font-semibold">Kurumsal sitenizi kurun</p>
            <span className="rounded-full bg-slate-900 px-2.5 py-0.5 text-xs font-bold text-white dark:bg-slate-100 dark:text-slate-900">
              %{percent}
            </span>
            <span className="text-xs text-muted-foreground">
              {completed}/{steps.length} adım
            </span>
          </div>
          <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
            <div className="h-full rounded-full bg-emerald-600" style={{ width: `${percent}%` }} />
          </div>
          <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5">
            {steps.map((step) => (
              <li key={step.id} className="flex items-center gap-1.5 text-sm">
                {step.done ? (
                  <CheckCircle2 className="size-4 shrink-0 text-emerald-600" />
                ) : (
                  <Circle className="size-4 shrink-0 text-slate-300 dark:text-slate-600" />
                )}
                <span className={cn(step.done ? "text-muted-foreground line-through" : "font-medium")}>{step.title}</span>
              </li>
            ))}
          </ul>
        </div>
        <Link
          href="/settings/kurumsal?sihirbaz=1"
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-card px-4 py-3 text-sm font-semibold hover:bg-muted dark:border-slate-700"
        >
          {next ? `Devam et: ${next.title}` : "Sihirbazı aç"} <ArrowRight className="size-4" />
        </Link>
      </div>
    </Card>
  );
}
