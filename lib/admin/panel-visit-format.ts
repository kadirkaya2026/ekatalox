// Süper admin panel ziyaretleri (0157) için ortak biçimlendirme: panel yolu →
// menü adı, user-agent → kısa cihaz adı. Giriş logları ve tenant detayı
// aynı etiketleri göstersin diye tek yerde.

const PAGE_LABELS: [string, string][] = [
  ["/products/add", "Ürün Ekle"],
  ["/products/bulk", "Toplu Ürün Ekleme"],
  ["/products/market-catalog", "Master Katalog"],
  ["/products/stock-import", "Stok İçe Aktarma"],
  ["/products/showcase", "Vitrin"],
  ["/products/best-sellers", "Çok Satanlar"],
  ["/products/suggestions", "Ürün Önerileri"],
  ["/products/bizimhesap", "BizimHesap"],
  ["/products", "Ürünler"],
  ["/categories", "Kategoriler"],
  ["/access-codes", "Fiyat Listeleri"],
  ["/basvurular", "Başvurular"],
  ["/customers", "Müşteriler"],
  ["/siparisler", "Siparişler"],
  ["/reports/iller", "İller Raporu"],
  ["/reports/satis", "Satış Raporu"],
  ["/reports", "Raporlar"],
  ["/magnetler", "Magnetler"],
  ["/settings", "Ayarlar"],
];

export function panelPageLabel(path: string | null | undefined): string | null {
  if (!path) return null;
  const clean = path.replace(/^\/dashboard/, "") || "/";
  if (clean === "/") return "Genel Bakış";
  const hit = PAGE_LABELS.find(([prefix]) => clean === prefix || clean.startsWith(`${prefix}/`));
  return hit ? hit[1] : clean;
}

// "iPhone · Safari", "Windows · Chrome" gibi kısa cihaz adı.
export function describeDevice(userAgent: string | null | undefined): string | null {
  if (!userAgent) return null;
  const ua = userAgent;
  const os = /iPhone/.test(ua)
    ? "iPhone"
    : /iPad/.test(ua)
      ? "iPad"
      : /Android/.test(ua)
        ? "Android"
        : /Windows/.test(ua)
          ? "Windows"
          : /Macintosh|Mac OS X/.test(ua)
            ? "Mac"
            : /Linux/.test(ua)
              ? "Linux"
              : null;
  const browser = /Edg\//.test(ua)
    ? "Edge"
    : /OPR\//.test(ua)
      ? "Opera"
      : /SamsungBrowser/.test(ua)
        ? "Samsung"
        : /Chrome\//.test(ua) && !/Chromium/.test(ua)
          ? "Chrome"
          : /Firefox\//.test(ua)
            ? "Firefox"
            : /Safari\//.test(ua)
              ? "Safari"
              : null;
  return [os, browser].filter(Boolean).join(" · ") || null;
}

export function formatVisitDuration(start: string, end: string): string {
  const minutes = Math.max(0, Math.round((new Date(end).getTime() - new Date(start).getTime()) / 60_000));
  if (minutes < 1) return "< 1 dk";
  if (minutes < 60) return `${minutes} dk`;
  return `${Math.floor(minutes / 60)} sa ${minutes % 60} dk`;
}
