// Müşterinin sipariş takip "oturumu": sunucu tarafı hesap yok, yetki telefon
// numarası. Numara ve "hangi sipariş güncellemesini gördü" bilgisi yalnız bu
// cihazın tarayıcısında tutulur. Sepetten sipariş verilince numara buraya
// yazılır (başka numarayla verilirse üzerine yazılır); /siparislerim ve
// takip sayfası gördüklerini işaretler; başlıktaki rozet görülmemişleri sayar.
const PHONE_KEY = "ekx-track-phone";
const SEEN_KEY = "ekx-track-seen";

export function readTrackingPhone(): string | null {
  try {
    return window.localStorage.getItem(PHONE_KEY);
  } catch {
    return null;
  }
}

export function saveTrackingPhone(phone: string) {
  try {
    if (phone.trim()) {
      window.localStorage.setItem(PHONE_KEY, phone.trim());
      window.dispatchEvent(new Event("ekx-track-phone-changed"));
    }
  } catch {
    /* özel pencere / depolama kapalı */
  }
}

export function clearTrackingPhone() {
  try {
    window.localStorage.removeItem(PHONE_KEY);
    window.localStorage.removeItem(SEEN_KEY);
  } catch {
    /* yok say */
  }
}

// order_no → görülen status_updated_at
export type SeenMap = Record<string, string>;

export function readSeen(): SeenMap {
  try {
    const raw = window.localStorage.getItem(SEEN_KEY);
    const parsed = raw ? (JSON.parse(raw) as unknown) : null;
    return parsed && typeof parsed === "object" ? (parsed as SeenMap) : {};
  } catch {
    return {};
  }
}

export function markSeen(entries: Array<{ orderNo: number | null; statusUpdatedAt: string }>) {
  try {
    const seen = readSeen();
    for (const e of entries) {
      if (typeof e.orderNo === "number") seen[String(e.orderNo)] = e.statusUpdatedAt;
    }
    window.localStorage.setItem(SEEN_KEY, JSON.stringify(seen));
    window.dispatchEvent(new Event("ekx-track-seen-changed"));
  } catch {
    /* yok say */
  }
}

// Rozet sayısı: müşterinin görmediği durum değişikliği olan siparişler.
// 'new' sayılmaz (siparişi kendisi verdi); 14 günden eski güncellemeler
// sayılmaz (ilk açılışta eski siparişler rozeti şişirmesin).
export function countUnseen(
  orders: Array<{ order_no: number | null; status: string; status_updated_at: string }>,
  seen: SeenMap,
) {
  const cutoff = Date.now() - 14 * 24 * 60 * 60 * 1000;
  return orders.filter((o) => {
    if (o.status === "new" || typeof o.order_no !== "number") return false;
    if (new Date(o.status_updated_at).getTime() < cutoff) return false;
    return seen[String(o.order_no)] !== o.status_updated_at;
  }).length;
}
