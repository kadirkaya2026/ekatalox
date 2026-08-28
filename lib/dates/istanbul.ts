// Takvim yardımcıları — Europe/Istanbul günü, ISO tarih ("YYYY-MM-DD").
// Saf/istemci-güvenli: tarayıcıda preset hesaplarken de kullanılıyor.

export function getIstanbulToday(now: Date = new Date()): string {
  return now.toLocaleDateString("en-CA", { timeZone: "Europe/Istanbul" });
}

function parseIso(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}
function toIso(date: Date) {
  return date.toISOString().slice(0, 10);
}

export function shiftIsoDate(iso: string, days: number): string {
  const d = parseIso(iso);
  d.setUTCDate(d.getUTCDate() + days);
  return toIso(d);
}

/** ISO hafta: Pazartesi başlangıç. */
export function startOfIsoWeek(iso: string): string {
  const d = parseIso(iso);
  const dow = (d.getUTCDay() + 6) % 7; // Pzt=0
  d.setUTCDate(d.getUTCDate() - dow);
  return toIso(d);
}

export function startOfMonth(iso: string): string {
  return `${iso.slice(0, 7)}-01`;
}

export function endOfMonth(iso: string): string {
  const d = parseIso(startOfMonth(iso));
  d.setUTCMonth(d.getUTCMonth() + 1);
  d.setUTCDate(0);
  return toIso(d);
}

export function startOfYear(iso: string): string {
  return `${iso.slice(0, 4)}-01-01`;
}

export function diffDays(fromIso: string, toIso_: string): number {
  return Math.round((parseIso(toIso_).getTime() - parseIso(fromIso).getTime()) / 86_400_000);
}

export function addMonths(iso: string, months: number): string {
  const d = parseIso(iso);
  d.setUTCMonth(d.getUTCMonth() + months);
  return toIso(d);
}

/** from..to aralığını bucket başlangıçlarına böler (boş dönemler için). */
export function enumerateBuckets(from: string, to: string, bucket: "day" | "week" | "month"): string[] {
  const out: string[] = [];
  let cursor = bucket === "day" ? from : bucket === "week" ? startOfIsoWeek(from) : startOfMonth(from);
  let guard = 0;
  while (cursor <= to && guard < 800) {
    out.push(cursor);
    cursor = bucket === "day" ? shiftIsoDate(cursor, 1) : bucket === "week" ? shiftIsoDate(cursor, 7) : addMonths(cursor, 1);
    guard += 1;
  }
  return out;
}

export function formatBucketLabel(bucketStart: string, bucket: "day" | "week" | "month"): string {
  const d = parseIso(bucketStart);
  if (bucket === "month") {
    return d.toLocaleDateString("tr-TR", { month: "long", year: "numeric", timeZone: "UTC" });
  }
  if (bucket === "week") {
    const end = parseIso(shiftIsoDate(bucketStart, 6));
    const f = (x: Date) => x.toLocaleDateString("tr-TR", { day: "numeric", month: "short", timeZone: "UTC" });
    return `${f(d)} – ${f(end)}`;
  }
  return d.toLocaleDateString("tr-TR", { day: "numeric", month: "short", timeZone: "UTC" });
}
