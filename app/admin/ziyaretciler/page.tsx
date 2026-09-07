// Pazarlama sitesi ziyaretçi raporu — her açılışta güncel veri.
export const dynamic = "force-dynamic";

import { SiteAnalyticsPanel } from "@/components/admin/site-analytics-panel";
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
  searchParams: Promise<{ preset?: string; from?: string; to?: string; bucket?: string }>;
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

  const bucket: SiteAnalyticsBucket =
    params.bucket === "day" || params.bucket === "week" || params.bucket === "month" ? params.bucket : autoSiteBucket(from, to);

  const report = await getSiteAnalyticsReport({ from, to, bucket });

  return (
    <div className="space-y-6">
      <Header
        eyebrow="Ziyaretçiler"
        title="ekatalox.com ziyaretçi analitiği"
        description="Siteye kaç kişi girdi, hangi sayfalara baktı, ne kadar kaldı, nereye tıkladı ve nereden çıktı. Yalnızca pazarlama sitesi izlenir; bayi panelleri ve vitrinler dahil değildir."
      />

      <SiteAnalyticsPanel initialReport={report} initialPreset={preset} />
    </div>
  );
}
