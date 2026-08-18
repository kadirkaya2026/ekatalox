// Master Katalog taksonomisindeki (bkz. lib/market-catalog/category-taxonomy.ts)
// 21 ana kategori için elle hazırlanmış, TÜM tenant'larda ortak kullanılan
// standart ikonlar — marketgo tenant'ının her kategorisine manuel yüklediği
// görsellerle aynı set (kullanıcı isteği, 18 Ağu 2026). category-icons
// Supabase Storage bucket'ına yüklendi (bkz. supabase/migrations/
// 0075_category_icons_bucket.sql). Anahtar, tenant'ın kategori adıyla
// BİREBİR (case-sensitive) eşleşmeli — bu isimler resolveCategoryPath'in
// (Master Katalog importu) ürettiği ana kategori adlarıyla aynı.
const STORAGE_BASE_URL =
  "https://mfsjzivcsvrxuegqzafe.supabase.co/storage/v1/object/public/category-icons";

export const DEFAULT_CATEGORY_ICONS: Record<string, string> = {
  "Alkol": `${STORAGE_BASE_URL}/alkol.png`,
  "Atıştırmalık": `${STORAGE_BASE_URL}/atistirmalik.png`,
  "Bebek": `${STORAGE_BASE_URL}/bebek.png`,
  "Cinsel Sağlık": `${STORAGE_BASE_URL}/cinsel-saglik.png`,
  "Dondurma": `${STORAGE_BASE_URL}/dondurma.png`,
  "Dondurulmuş": `${STORAGE_BASE_URL}/dondurulmus.png`,
  "Et, Tavuk & Balık": `${STORAGE_BASE_URL}/et-tavuk-balik.png`,
  "Ev Bakım": `${STORAGE_BASE_URL}/ev-bakim.png`,
  "Ev & Yaşam": `${STORAGE_BASE_URL}/ev-yasam.png`,
  "Evcil Hayvan": `${STORAGE_BASE_URL}/evcil-hayvan.png`,
  "Fırından": `${STORAGE_BASE_URL}/firindan.png`,
  "Fit & Form": `${STORAGE_BASE_URL}/fit-form.png`,
  "İndirimli Ürünler": `${STORAGE_BASE_URL}/indirimli-urunler.png`,
  "Kahvaltılık": `${STORAGE_BASE_URL}/kahvaltilik.png`,
  "Kişisel Bakım": `${STORAGE_BASE_URL}/kisisel-bakim.png`,
  "Meyve & Sebze": `${STORAGE_BASE_URL}/meyve-sebze.png`,
  "Pratik Yemek": `${STORAGE_BASE_URL}/pratik-yemek.png`,
  "Sigara": `${STORAGE_BASE_URL}/sigara.png`,
  "Su & İçecek": `${STORAGE_BASE_URL}/su-icecek.png`,
  "Süt Ürünleri": `${STORAGE_BASE_URL}/sut-urunleri.png`,
  "Teknoloji": `${STORAGE_BASE_URL}/teknoloji.png`,
  "Temel Gıda": `${STORAGE_BASE_URL}/temel-gida.png`,
};
