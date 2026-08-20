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

// Gövdesiz çağrı tenant'ın TÜM okunmamış bildirimlerini kapatır; bu yüzden
// suggestionId her zaman gönderiliyor.
export async function dismissSuggestionNotice(suggestionId: string) {
  await fetch("/api/tenant/products/product-suggestions/dismiss", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ suggestionId }),
  }).catch(() => undefined);
}
