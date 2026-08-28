import {
  diffDays,
  endOfMonth,
  getIstanbulToday,
  shiftIsoDate,
  startOfIsoWeek,
  startOfMonth,
  startOfYear,
} from "@/lib/dates/istanbul";

export type SalesBucket = "day" | "week" | "month";
export type SalesPreset =
  | "today"
  | "yesterday"
  | "this_week"
  | "last_week"
  | "this_month"
  | "last_month"
  | "last_30"
  | "this_year"
  | "custom";

export const SALES_PRESET_LABELS: Record<Exclude<SalesPreset, "custom">, string> = {
  today: "Bugün",
  yesterday: "Dün",
  this_week: "Bu hafta",
  last_week: "Geçen hafta",
  this_month: "Bu ay",
  last_month: "Geçen ay",
  last_30: "Son 30 gün",
  this_year: "Bu yıl",
};

/** Özel aralıkta uzunluğa göre otomatik bucket. */
export function autoBucket(from: string, to: string): SalesBucket {
  const days = diffDays(from, to) + 1;
  if (days <= 62) return "day";
  if (days <= 366) return "week";
  return "month";
}

export function resolvePreset(preset: Exclude<SalesPreset, "custom">, today = getIstanbulToday()) {
  switch (preset) {
    case "today":
      return { from: today, to: today, bucket: "day" as const };
    case "yesterday": {
      const d = shiftIsoDate(today, -1);
      return { from: d, to: d, bucket: "day" as const };
    }
    case "this_week":
      return { from: startOfIsoWeek(today), to: today, bucket: "day" as const };
    case "last_week": {
      const start = shiftIsoDate(startOfIsoWeek(today), -7);
      return { from: start, to: shiftIsoDate(start, 6), bucket: "day" as const };
    }
    case "this_month":
      return { from: startOfMonth(today), to: today, bucket: "day" as const };
    case "last_month": {
      const lastMonthDay = shiftIsoDate(startOfMonth(today), -1);
      return { from: startOfMonth(lastMonthDay), to: endOfMonth(lastMonthDay), bucket: "day" as const };
    }
    case "last_30":
      return { from: shiftIsoDate(today, -29), to: today, bucket: "day" as const };
    case "this_year":
      return { from: startOfYear(today), to: today, bucket: "month" as const };
  }
}
