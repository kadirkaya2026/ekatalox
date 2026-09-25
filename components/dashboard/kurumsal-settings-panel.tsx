"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Building2, Check, Copy, ExternalLink, Inbox, Loader2, Lock, Pencil, Sparkles } from "lucide-react";
import { KurumsalDomainCard } from "@/components/dashboard/kurumsal-domain-card";
import { KurumsalWizard, type KurumsalWizardContext } from "@/components/dashboard/kurumsal-wizard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getKurumsalPublishState, KURUMSAL_PUBLISH_STATE_LABELS } from "@/lib/kurumsal/domain";
import type { DomainRequest } from "@/lib/kurumsal/domain-requests";
import type { KurumsalContent, KurumsalSiteRecord } from "@/lib/kurumsal/schema";

// Ayarlar → Kurumsal Site: durum kartı (Yayında / Taslak / Kurulmadı),
// kendi alan adı bağlama, sihirbaz ve yayın aç/kapat. Paket kapsamıyorsa
// (yalnız en üst paket) sihirbaz yerine yükseltme kartı gösterilir.

const dateFormatter = new Intl.DateTimeFormat("tr-TR", {
  day: "2-digit",
  month: "long",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

export function KurumsalSettingsPanel(props: {
  entitled: boolean;
  /** ?sihirbaz=1 (Genel Bakış kartı): sayfa açılınca sihirbaz açılır */
  autoOpen?: boolean;
  upgradeHref: string;
  planName: string;
  initialSite: KurumsalSiteRecord | null;
  initialDomain: string | null;
  initialRequest: DomainRequest | null;
  domainRequestHref: string;
  defaults: KurumsalContent;
  ctx: KurumsalWizardContext;
}) {
  if (!props.entitled) {
    return <KurumsalUpsell upgradeHref={props.upgradeHref} planName={props.planName} />;
  }
  return <EntitledPanel {...props} />;
}

function KurumsalUpsell({ upgradeHref, planName }: { upgradeHref: string; planName: string }) {
  return (
    <Card className="flex flex-col gap-4 p-6 sm:flex-row sm:items-start">
      <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300">
        <Lock className="size-6" />
      </div>
      <div className="min-w-0 flex-1">
        <h2 className="text-lg font-semibold">Kurumsal site en üst pakette</h2>
        <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">
          Kendi alan adınızda (firmaniz.com) şifre sormayan, Google&apos;da çıkan kurumsal site: firmanız, fiyatsız ürün
          katalogunuz, &quot;Neden biz&quot; bölümü ve bayi başvuru formu. Gelen başvurular panelinize düşer. Şu anki paketiniz:{" "}
          <span className="font-semibold text-foreground">{planName}</span>.
        </p>
        <a
          href={upgradeHref}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-700"
        >
          <Sparkles className="size-4" /> Paketimi yükselt
        </a>
      </div>
    </Card>
  );
}

function EntitledPanel({
  initialSite,
  initialDomain,
  initialRequest,
  domainRequestHref,
  defaults,
  autoOpen = false,
  ctx: baseCtx,
}: {
  autoOpen?: boolean;
  initialSite: KurumsalSiteRecord | null;
  initialDomain: string | null;
  initialRequest: DomainRequest | null;
  domainRequestHref: string;
  defaults: KurumsalContent;
  ctx: KurumsalWizardContext;
}) {
  const router = useRouter();
  const [domain, setDomain] = useState(initialDomain);
  const [domainRequest, setDomainRequest] = useState(initialRequest);
  // Alan adı yoksa site katalog adresinde /kurumsal'da yayınlanır.
  const ctx: KurumsalWizardContext = {
    ...baseCtx,
    publicUrl: domain ? `https://${domain}` : `${baseCtx.catalogUrl}/kurumsal`,
  };
  const [site, setSite] = useState(initialSite);
  const [wizardOpen, setWizardOpen] = useState(autoOpen);
  // Her açılışta sihirbaz son kayıtlı içerikle sıfırdan kurulsun.
  const [wizardSession, setWizardSession] = useState(0);
  const [toggling, setToggling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const published = Boolean(site?.is_published);
  const publishState = getKurumsalPublishState(published, domain);

  function openWizard() {
    setWizardSession((n) => n + 1);
    setWizardOpen(true);
  }

  function closeWizard() {
    setWizardOpen(false);
    if (autoOpen) window.history.replaceState(null, "", window.location.pathname);
    router.refresh();
  }

  function handleDomainChange(next: string | null) {
    setDomain(next);
    router.refresh();
  }

  async function togglePublish() {
    if (!site) return;
    setError(null);
    setToggling(true);
    try {
      const res = await fetch("/api/tenant/kurumsal", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: site.content, is_published: !published }),
      });
      const result = (await res.json().catch(() => null)) as { error?: string; site?: KurumsalSiteRecord } | null;
      if (!res.ok || !result?.site) {
        setError(result?.error ?? "Kaydedilemedi.");
        return;
      }
      setSite(result.site);
      router.refresh();
    } catch {
      setError("Bağlantı kurulamadı.");
    } finally {
      setToggling(false);
    }
  }

  async function copyUrl() {
    if (!ctx.publicUrl) return;
    try {
      await navigator.clipboard.writeText(ctx.publicUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* pano izni yok */
    }
  }

  return (
    <div className="space-y-6">
      <Card className="p-5 sm:p-6">
        <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
          <div className="flex gap-4">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
              <Building2 className="size-6" />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg font-semibold">Kurumsal Site</h2>
                {!site ? (
                  <Badge variant="neutral">Kurulmadı</Badge>
                ) : (
                  <Badge variant={publishState === "draft" ? "warning" : "success"}>
                    {KURUMSAL_PUBLISH_STATE_LABELS[publishState]}
                  </Badge>
                )}
              </div>
              <p className="mt-1 max-w-xl text-sm leading-6 text-muted-foreground">
                Şifresiz, Google&apos;da çıkan tanıtım sayfanız: firmanız, ürün gruplarınız (fiyatsız), neden sizi seçmeleri
                gerektiği ve bayi başvuru formu. Fiyatlar yine yalnızca bayi girişinde görünür.
              </p>
              {site ? (
                <p className="mt-2 text-xs text-muted-foreground">
                  {published && site.published_at
                    ? `Yayına alındı: ${dateFormatter.format(new Date(site.published_at))}`
                    : site.updated_at
                      ? `Son kayıt: ${dateFormatter.format(new Date(site.updated_at))}`
                      : null}
                </p>
              ) : null}
            </div>
          </div>
          <div className="flex shrink-0 flex-wrap gap-2">
            {site ? (
              <>
                <Button variant="secondary" onClick={openWizard}>
                  <Pencil className="size-4" /> Düzenle
                </Button>
                <Button variant={published ? "secondary" : "primary"} onClick={togglePublish} disabled={toggling}>
                  {toggling ? <Loader2 className="size-4 animate-spin" /> : null}
                  {published ? "Yayından kaldır" : "Yayınla"}
                </Button>
              </>
            ) : (
              <Button onClick={openWizard}>
                <Sparkles className="size-4" /> Sihirbazı başlat
              </Button>
            )}
          </div>
        </div>

        <div className="mt-5 flex flex-col gap-2 rounded-xl bg-muted px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Sitenizin adresi</p>
            <p className="mt-0.5 break-all text-sm font-semibold">{ctx.publicUrl}</p>
          </div>
          <div className="flex shrink-0 gap-2">
            <Button variant="ghost" onClick={copyUrl} className="py-2">
              {copied ? <Check className="size-4" /> : <Copy className="size-4" />} {copied ? "Kopyalandı" : "Kopyala"}
            </Button>
            {published ? (
              <a
                href={ctx.publicUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-emerald-700 hover:bg-card dark:text-emerald-400"
              >
                <ExternalLink className="size-4" /> Aç
              </a>
            ) : null}
          </div>
        </div>
        {!domain && domainRequest ? (
          <p className="mt-3 text-xs text-muted-foreground">
            Alan adı talebiniz bekliyor: <span className="font-semibold text-foreground">{domainRequest.domain}</span>. Bağlanınca site
            otomatik oraya taşınır.
          </p>
        ) : !domain ? (
          <p className="mt-3 text-xs text-muted-foreground">
            Kendi alan adınızı bağlayınca site otomatik oraya taşınır (aşağıdaki &quot;Alan adı&quot; bölümü).
          </p>
        ) : !published ? (
          <p className="mt-3 text-xs text-muted-foreground">
            Site yayında değilken bu adres &quot;sayfa bulunamadı&quot; gösterir.
          </p>
        ) : null}

        {error ? (
          <p className="mt-3 text-sm text-rose-600" role="alert">
            {error}
          </p>
        ) : null}
      </Card>

      <KurumsalDomainCard
        key={`${domain ?? "yok"}-${domainRequest?.id ?? "talep-yok"}`}
        initialDomain={domain}
        domainRequestHref={domainRequestHref}
        onDomainChange={handleDomainChange}
        initialRequest={domainRequest}
        onRequestChange={setDomainRequest}
      />

      <Card className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-3">
          <Inbox className="mt-0.5 size-5 shrink-0 text-emerald-700 dark:text-emerald-400" />
          <p className="text-sm leading-6 text-muted-foreground">
            Başvuru formunu dolduran firmalar <span className="font-semibold text-foreground">Bayi Başvuruları</span> sayfasında
            listelenir; arayıp durumunu işaretleyin, onayladıklarınıza Şifreler&apos;den portal şifresi verin.
          </p>
        </div>
        <Link
          href="/basvurular"
          className="shrink-0 rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold hover:bg-muted dark:border-slate-700"
        >
          Başvuruları gör
        </Link>
      </Card>

      {wizardOpen ? (
        <KurumsalWizard
          key={wizardSession}
          open={wizardOpen}
          onClose={closeWizard}
          initialContent={site?.content ?? defaults}
          initialPublished={published}
          ctx={ctx}
          onSaved={setSite}
          initialDomain={domain}
          domainRequestHref={domainRequestHref}
          onDomainChange={handleDomainChange}
          initialRequest={domainRequest}
          onRequestChange={setDomainRequest}
        />
      ) : null}
    </div>
  );
}
