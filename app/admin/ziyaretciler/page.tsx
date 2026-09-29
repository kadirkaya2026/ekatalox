// Pazarlama sitesi ziyaretçi raporu — her açılışta güncel veri.
export const dynamic = "force-dynamic";

import Link from "next/link";
import { SiteAnalyticsPanel } from "@/components/admin/site-analytics-panel";
import { VisitorStoriesView } from "@/components/admin/visitor-stories-view";
import { Header } from "@/components/dashboard/header";
import { getIstanbulToday, shiftIsoDate } from "@/lib/dates/istanbul";
import { resolvePreset, type SalesPreset } from "@/lib/sales/presets";
import { autoSiteBucket, getSiteAnalyticsReport } from "@/lib/site-analytics/report";
import type { SiteAnalyticsBucket } from "@/lib/site-analytics/types";

type PresetKey = Exclude<SalesPreset, "custom"> | "last_7";
const PRESET_KEYS: PresetKey[] = ["today", "yesterday", "last_7", "this_week", "last_week", "this_month", "last_month", "last_30", "this_year"];
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export default async function AdminSiteAnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ preset?: string; from?: string; to?: string; bucket?: string; sekme?: string; gun?: string }>;
}) {
  const params = await searchParams;
  const today = getIstanbulToday();

  let preset: PresetKey | "custom" = "last_7";
  let from = shiftIsoDate(today, -6);
  let to = today;

  if (params.preset === "custom" && params.from && params.to && ISO_DATE.test(params.from) && ISO_DATE.test(params.to) && params.from <= params.to) {
    preset = "custom";
    from = params.from;
    to = params.to;
  } else if (params.preset && PRESET_KEYS.includes(params.preset as PresetKey)) {
    preset = params.preset as PresetKey;
    if (preset !== "last_7") {
      const r = resolvePreset(preset, today);
      from = r.from;
      to = r.to;
    }
  }

  const storiesTab = params.sekme === "hikayeler";
  const tabs = (
    <div className="flex gap-1 rounded-xl border border-slate-200 bg-white p-1">
      {[
        { key: "rapor", label: "Grafikli rapor", href: "/ziyaretciler" },
        { key: "hikayeler", label: "Ziyaretçi hikâyeleri", href: "/ziyaretciler?sekme=hikayeler" },
      ].map((tab) => {
        const active = (tab.key === "hikayeler") === storiesTab;
        return (
          <Link
            key={tab.key}
            href={tab.href}
            className={`flex-1 rounded-lg px-4 py-2 text-center text-sm font-semibold transition ${active ? "bg-emerald-600 text-white" : "text-slate-600 hover:bg-slate-50"}`}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
  const header = (
    <Header
      eyebrow="Ziyaretçiler"
      title="ekatalox.com ziyaretçi analitiği"
      description="Siteye kaç kişi girdi, hangi sayfalara baktı, ne kadar kaldı, nereye tıkladı ve nereden çıktı. Yalnızca pazarlama sitesi izlenir; bayi panelleri ve vitrinler dahil değildir."
    />
  );

  if (storiesTab) {
    const day = params.gun && ISO_DATE.test(params.gun) && params.gun <= today ? params.gun : today;
    return (
      <div className="space-y-6">
        {header}
        {tabs}
        <VisitorStoriesView day={day} />
      </div>
    );
  }

  const bucket: SiteAnalyticsBucket =
    params.bucket === "day" || params.bucket === "week" || params.bucket === "month" ? params.bucket : autoSiteBucket(from, to);

  const report = await getSiteAnalyticsReport({ from, to, bucket });

  return (
    <div className="space-y-6">
      {header}
      {tabs}

      <SiteAnalyticsPanel initialReport={report} initialPreset={preset} />
    </div>
  );
}
