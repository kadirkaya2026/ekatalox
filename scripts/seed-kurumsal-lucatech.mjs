// Lucatech kurumsal site içeriği (25 Eyl 2026). Önceden
// lib/storefront/kurumsal-content.ts içinde kod olarak duran metin,
// tenant_kurumsal_sites tablosuna (bkz. 0133) yeni şemayla
// (lib/kurumsal/schema.ts) taşındı. Referans için saklanıyor; tekrar
// çalıştırmak panelde yapılan düzenlemelerin ÜZERİNE YAZAR.
//
// NOT (0134): kurumsal site artık yalnız tenant'ın kendi kök alan adında
// (tenants.kurumsal_domain) ve "kurumsal_site" paketinde yayınlanır. Bu
// script kurumsal_domain'e DOKUNMAZ — lucatech.com.tr şu an Lucatech'in canlı
// WordPress sitesi; alan adı bağlanana kadar içerik taslak gibi bekler.
//
// Kullanım:
//   set -a; source .env.local; set +a; node scripts/seed-kurumsal-lucatech.mjs
import { createClient } from "@supabase/supabase-js";

const TENANT_ID = "ebeeec82-7cd9-4ab8-bea9-f3dc2a5bfe0c"; // subdomain: lucatech

const content = {
  sector: "telefon-aksesuar",
  eyebrow: "Akıllı Telefon Aksesuarları",
  headline: "Kaliteyi Keşfet.",
  tagline:
    "Kulaklıktan powerbank'e, şarj aletinden telefon tutucuya; Lucatech ürünleri bayilerimiz aracılığıyla Türkiye'nin dört bir yanında.",
  about: [
    "Lucatech, akıllı telefon ve elektronik aksesuarlarında kaliteyi herkes için ulaşılabilir kılmak amacıyla yola çıkmış bir İstanbul markasıdır. Kulaklık, hoparlör, powerbank, şarj aleti, kablo ve araç aksesuarlarından oluşan geniş ürün yelpazemizi kendi markamızla sunuyoruz.",
    "Satışlarımızı bayi ve toptan kanalıyla yapıyoruz. Bayilerimiz güncel fiyat listemize ve tüm ürün kataloğumuza bayi portalımız üzerinden 7/24 ulaşır, siparişlerini birkaç dokunuşla WhatsApp üzerinden iletir.",
  ],
  legal_name: "LUCATECH İTHALAT VE İHRACAT SAN. TİC. LTD. ŞTİ.",
  phone: "+90 (212) 489 27 39",
  city: "İstanbul",
  customer_type: "bayi",
  highlights: [
    { title: "2 Yıl Garanti", body: "Tüm Lucatech ürünleri üretim hatalarına karşı 2 yıl garantilidir." },
    {
      title: "Geniş Ürün Yelpazesi",
      body: "Kulaklıktan powerbank'e, kablodan araç tutucuya tek tedarikçiden eksiksiz raf.",
    },
    {
      title: "Bayilere Özel Fiyat",
      body: "Fiyat listemiz yalnızca bayilerimize açıktır; güncel fiyatlar portalda her zaman hazır.",
    },
    {
      title: "WhatsApp ile Hızlı Sipariş",
      body: "Katalogdan sepetini oluştur, siparişini tek dokunuşla WhatsApp'tan ilet.",
    },
  ],
  badge: { value: "2 Yıl", label: "Garanti" },
  // null: kapı markası (public/gate/lucatech/bg.jpg, #F58220) kullanılır.
  hero_image_url: null,
  accent_color: null,
  sections: { featured: true, steps: true, map: true, form: true },
};

const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY eksik (.env.local'i source edin).");
  process.exit(1);
}

const supabase = createClient(url, key, { auth: { persistSession: false } });
const now = new Date().toISOString();
const { data, error } = await supabase
  .from("tenant_kurumsal_sites")
  .upsert(
    { tenant_id: TENANT_ID, is_published: true, content, published_at: now, updated_at: now },
    { onConflict: "tenant_id" },
  )
  .select("tenant_id, is_published, published_at")
  .single();

if (error) {
  console.error("Hata:", error.message);
  process.exit(1);
}
console.log("Tamam:", data);
