import type { BusinessDayHours, BusinessHours, WeekdayKey } from "@/lib/types";

export const WEEKDAY_ORDER: WeekdayKey[] = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];

export const WEEKDAY_LABELS_TR: Record<WeekdayKey, string> = {
  mon: "Pazartesi",
  tue: "Salı",
  wed: "Çarşamba",
  thu: "Perşembe",
  fri: "Cuma",
  sat: "Cumartesi",
  sun: "Pazar",
};

function defaultDayHours(isOpen: boolean): BusinessDayHours {
  return { is_open: isOpen, open_time: "09:00", close_time: "22:00" };
}

export const DEFAULT_BUSINESS_HOURS: BusinessHours = {
  mon: defaultDayHours(true),
  tue: defaultDayHours(true),
  wed: defaultDayHours(true),
  thu: defaultDayHours(true),
  fri: defaultDayHours(true),
  sat: defaultDayHours(true),
  sun: defaultDayHours(true),
};

// Mağaza saatleri her zaman İstanbul saatine göre yorumlanır — admin panelde
// tek bir saat dilimi seçeneği yok, ve platformun tüm müşteri kitlesi TR.
// Sunucu (Vercel, UTC) ile ziyaretçinin tarayıcısı farklı saat dilimlerinde
// olabileceği için Date.getHours() yerine Intl ile İstanbul'a göre saat/gün
// çözülüyor.
const STORE_TIMEZONE = "Europe/Istanbul";

const WEEKDAY_SHORT_TO_KEY: Record<string, WeekdayKey> = {
  Mon: "mon",
  Tue: "tue",
  Wed: "wed",
  Thu: "thu",
  Fri: "fri",
  Sat: "sat",
  Sun: "sun",
};

function getIstanbulNow(date: Date): { weekday: WeekdayKey; minutesSinceMidnight: number } {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: STORE_TIMEZONE,
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const parts = formatter.formatToParts(date);
  const weekdayShort = parts.find((part) => part.type === "weekday")?.value ?? "Mon";
  // Saat 24:00 olarak "hour12: false" ile bazı runtime'larda gece yarısı "24"
  // döndürülebiliyor — 0'a normalize ediyoruz.
  const hourRaw = Number(parts.find((part) => part.type === "hour")?.value ?? "0");
  const hour = hourRaw === 24 ? 0 : hourRaw;
  const minute = Number(parts.find((part) => part.type === "minute")?.value ?? "0");

  return {
    weekday: WEEKDAY_SHORT_TO_KEY[weekdayShort] ?? "mon",
    minutesSinceMidnight: hour * 60 + minute,
  };
}

function parseTimeToMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map((part) => Number(part));
  return (Number.isFinite(hours) ? hours : 0) * 60 + (Number.isFinite(minutes) ? minutes : 0);
}

type BusinessHoursSettings = Pick<
  import("@/lib/types").TenantStorefrontSettings,
  "is_always_open" | "business_hours"
>;

export function isStoreOpenNow(settings: BusinessHoursSettings, now: Date = new Date()): boolean {
  if (settings.is_always_open) {
    return true;
  }

  const { weekday, minutesSinceMidnight } = getIstanbulNow(now);
  const today = settings.business_hours?.[weekday];

  if (today?.is_open) {
    const open = parseTimeToMinutes(today.open_time);
    const close = parseTimeToMinutes(today.close_time);

    if (close > open) {
      if (minutesSinceMidnight >= open && minutesSinceMidnight < close) {
        return true;
      }
    } else if (minutesSinceMidnight >= open || minutesSinceMidnight < close) {
      // Gece yarısını aşan aralık (ör. 18:00 - 02:00).
      return true;
    }
  }

  // Dünden gece yarısını aşarak bugüne taşan bir aralık açık olabilir (ör.
  // dün Cuma 18:00 - 02:00 seçiliyse Cumartesi 01:00'da hâlâ açığız).
  const yesterdayIndex = (WEEKDAY_ORDER.indexOf(weekday) + 6) % 7;
  const yesterday = settings.business_hours?.[WEEKDAY_ORDER[yesterdayIndex]];

  if (yesterday?.is_open) {
    const open = parseTimeToMinutes(yesterday.open_time);
    const close = parseTimeToMinutes(yesterday.close_time);

    if (close <= open && minutesSinceMidnight < close) {
      return true;
    }
  }

  return false;
}

export interface NextOpening {
  kind: "today" | "tomorrow" | "weekday";
  weekday: WeekdayKey;
  time: string;
}

/**
 * Mağaza şu an kapalıyken bir sonraki açılış zamanını bulur — bugünden
 * başlayarak 7 gün ileriye kadar tarar. Hiçbir gün açık değilse null döner.
 */
export function getNextOpening(
  settings: BusinessHoursSettings,
  now: Date = new Date(),
): NextOpening | null {
  if (settings.is_always_open) {
    return null;
  }

  const { weekday, minutesSinceMidnight } = getIstanbulNow(now);
  const todayIndex = WEEKDAY_ORDER.indexOf(weekday);

  for (let offset = 0; offset < 7; offset += 1) {
    const dayKey = WEEKDAY_ORDER[(todayIndex + offset) % 7];
    const day = settings.business_hours?.[dayKey];

    if (!day?.is_open) {
      continue;
    }

    const openMinutes = parseTimeToMinutes(day.open_time);

    if (offset === 0 && minutesSinceMidnight >= openMinutes) {
      // Bugünün açılış saati zaten geçmiş — sonraki güne bak.
      continue;
    }

    return {
      kind: offset === 0 ? "today" : offset === 1 ? "tomorrow" : "weekday",
      weekday: dayKey,
      time: day.open_time,
    };
  }

  return null;
}
