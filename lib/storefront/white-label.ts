import type { Tenant } from "@/lib/types";

// Market ve tekel bayilerinin vitrinlerinde eKatalox markası hiç
// görünmemeli (kullanıcı isteği, 21 Ağu 2026). Bu iki şeyi kapatır:
//   1) sayfanın altındaki "eKatalox ürünüdür" rozeti
//      (StorefrontPoweredByBar — daha önce bilerek kaldırılamaz
//       yapılmıştı, bkz. o dosyadaki yorum)
//   2) sekme başlığındaki "| eKatalox" eki (kök layout'taki
//      title template'i)
//
// Kapı, mobil anasayfa sıralamasıyla aynı: market VEYA tekel işaretli
// bayiler.
export function isWhiteLabelStorefront(
  tenant: Pick<Tenant, "business_type" | "is_tekel"> | null | undefined,
): boolean {
  return isMarketOrTekelTenant(tenant);
}

// "Market veya tekel bayii mi?" sorusunun tek kaynağı. Beyaz etiket,
// mobil anasayfa sıralaması (indirim şeridi + kategori kutuları) ve
// mobil alt navigasyon barı aynı kapıyı kullanıyor — üç ayrı yerde
// kopyalanmasın diye buraya alındı.
export function isMarketOrTekelTenant(
  tenant: Pick<Tenant, "business_type" | "is_tekel"> | null | undefined,
): boolean {
  if (!tenant) return false;
  return tenant.business_type === "market" || Boolean(tenant.is_tekel);
}

// Kök layout'ta title template'i "%s | eKatalox". absolute vermek o eki
// atlar; beyaz etiketli olmayan bayilerde eski davranış korunur.
export function buildStorefrontTitle(
  title: string,
  tenant: Pick<Tenant, "business_type" | "is_tekel"> | null | undefined,
) {
  return isWhiteLabelStorefront(tenant) ? { absolute: title } : title;
}

// Bayi kendi favicon'unu yüklemediyse Next.js app/favicon.ico'yu (eKatalox
// logosu) servis ediyor ve sekmede görünüyor. Beyaz etiketli vitrinlerde
// bunun yerine saydam bir ikon veriliyor — nötr bir sekme, eKatalox
// markası değil. Kalıcı çözüm bayinin Ayarlar > Mağaza Kimliği'nden kendi
// favicon'unu yüklemesi.
export function buildStorefrontIcons(
  faviconUrl: string | null | undefined,
  tenant: Pick<Tenant, "business_type" | "is_tekel"> | null | undefined,
) {
  if (faviconUrl) {
    return { icon: faviconUrl };
  }
  // Beyaz etiketli vitrinde bayi kendi ikonunu yüklemediyse hiç ikon
  // verilmez (boş dizi) — kök layout'un eKatalox favicon'u miras
  // alınmasın diye. Kalıcı çözüm bayinin Ayarlar > Mağaza Kimliği'nden
  // kendi favicon'unu yüklemesi.
  //
  // Beyaz etiketli OLMAYAN bayilerde eski davranış korunuyor: favicon
  // app/'ten public/'e taşındığı için burada açıkça verilmezse ikon hiç
  // basılmıyordu.
  return isWhiteLabelStorefront(tenant) ? { icon: [] } : { icon: "/favicon.ico" };
}
