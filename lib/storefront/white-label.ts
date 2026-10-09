import type { Tenant } from "@/lib/types";

// Beyaz etiket (eKatalox markasını gizleme) şu an HİÇBİR mağazada yok.
// 21 Ağu 2026'da market ve tekel vitrinlerinde gizlenmişti; 9 Eki 2026'da
// kullanıcı isteğiyle kaldırıldı: "Powered by eKatalox" rozeti, sekme
// başlığındaki "| eKatalox" eki ve varsayılan ikon artık bütün mağazalarda
// aynı. Tekrar açılırsa kapı burası (çağıranlar hidePoweredBy / title / icon).
export function isWhiteLabelStorefront(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- imza çağıranlar için korunuyor
  _tenant: Pick<Tenant, "business_type" | "is_tekel"> | null | undefined,
): boolean {
  return false;
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

// Müşterinin telefonuyla geçmiş siparişlerini gördüğü "Sipariş Takip" (/siparislerim):
// market/tekel vitrinlerinde her zaman açık; toptancılarda yalnız isteyen mağazalarda
// (Nailport, Vedat Bey isteği 7 Eki 2026). Başlık ikonu + sepette telefonun kaydı bu kapıya bağlı.
// Vitrin "Hesabım" (8 Eki 2026): kişiye özel bayi şifresiyle girene
// siparişlerim / tekrar sipariş / bilgilerim / adreslerim. Lucatech'te
// denendi, aynı gün market/tekel HARİÇ tüm mağazalara açıldı (kişiye özel
// şifre Kurumsal pakette; bkz. resolveStorefrontDealerProfile).
export function hasAccountPage(tenant: Pick<Tenant, "business_type" | "is_tekel">) {
  return !isMarketOrTekelTenant(tenant);
}

// Belirgin gezinme işaretleri (8 Eki 2026, İsego isteği): kalın "Daha fazla ürün
// göster" düğmesi + kategori şeridinde kaydırma okları/ipucu. Deneme; beğenilirse
// tüm mağazalara açılacak (components/storefront/enhanced-nav-cues.tsx).
const ENHANCED_NAV_CUE_SUBDOMAINS = new Set(["isego-ticaret"]);

export function hasEnhancedNavCues(tenant: { subdomain: string }) {
  return ENHANCED_NAV_CUE_SUBDOMAINS.has(tenant.subdomain);
}

const ORDER_TRACKING_SUBDOMAINS = new Set(["nailport"]);

export function hasOrderTracking(
  tenant: Pick<Tenant, "business_type" | "is_tekel" | "subdomain"> | null | undefined,
): boolean {
  if (!tenant) return false;
  return isMarketOrTekelTenant(tenant) || ORDER_TRACKING_SUBDOMAINS.has(tenant.subdomain);
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
    // PNG/JPG ikon yüklendiyse iPhone "Ana Ekrana Ekle" ikonu da o olur (apple-touch-icon);
    // .ico gibi küçük ikonlarda verilmez, iOS eskisi gibi sayfa görüntüsünü kullanır.
    const isBitmap = /\.(png|jpe?g)(\?|$)/i.test(faviconUrl);
    return isBitmap ? { icon: faviconUrl, apple: faviconUrl } : { icon: faviconUrl };
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
