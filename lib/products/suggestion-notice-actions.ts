import type { ProductSuggestion } from "@/lib/types";

// Onay bildirimi iki yerde gösteriliyor: "Önerdiğim Ürünler" sayfasındaki
// bildirim zili ve Ürünler sayfasındaki yeşil banner. Kural ikisinde de aynı
// olmalı (kullanıcı isteği): bir bildirim SADECE kullanıcı o mesaja
// tıkladığında okundu sayılır. Zili açmak, banner'ı kapatmak veya sayfada
// gezinmek hiçbir bildirimi silmez.
export function buildSuggestionProductHref(notice: ProductSuggestion) {
  // Ürün listesi sunucu tarafında sayfalandığı için ürünün kaçıncı sayfada
  // olduğu bilinemez; barkodla arama yapılarak ilk sayfaya getiriliyor
  // (arama sku_code'u da kapsıyor), focus parametresi de satırı vurguluyor.
  const params = new URLSearchParams({ q: notice.barcode });
  if (notice.product_id) {
    params.set("focus", notice.product_id);
  }
  return `/dashboard/products?${params.toString()}`;
}

// Zili açıp listeyi sonuna kadar kaydırmak bildirimleri SİLMEZ, sadece
// "görüldü" işaretler — menüdeki kırmızı sayaç sıfırlanır, bildirimler zilde
// kalır. Kapatma ayrı: tek tıklama (dismissSuggestionNotice) veya
// "Tümünü temizle" (dismissAllSuggestionNotices).
export async function markSuggestionNoticesSeen() {
  await fetch("/api/tenant/products/product-suggestions/seen", {
    method: "POST",
  }).catch(() => undefined);
}

// Gövdesiz çağrı tenant'ın TÜM okunmamış bildirimlerini kapatır — sadece
// "Tümünü temizle" bunu kullanır, tekil kapatma her zaman suggestionId
// gönderir.
export async function dismissAllSuggestionNotices() {
  await fetch("/api/tenant/products/product-suggestions/dismiss", {
    method: "POST",
  }).catch(() => undefined);
}
export async function dismissSuggestionNotice(suggestionId: string) {
  await fetch("/api/tenant/products/product-suggestions/dismiss", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ suggestionId }),
  }).catch(() => undefined);
}
