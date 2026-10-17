// Nailport kurumsal site içeriği (17 Eki 2026). Sihirbazın genel kozmetik
// şablonu (cilt/saç bakımı, kuruluş 2026) yerine firmaya özel metin. Bilgiler
// Vedat Aba'nın perakende sitesinden (abanails.com hakkımızda/iletişim):
// 2018'den beri, Antalya Konyaaltı, cihaz ve sarfın büyük kısmı doğrudan ithal.
// Tekrar çalıştırmak panelde yapılan düzenlemelerin ÜZERİNE YAZAR.
//
// Adres kurumsal sayfaya tenant_storefront_settings.footer_location'dan gelir
// (harita da ondan); script onu da yazar, vitrin altbilgisindeki görünürlük
// bayrağına (is_footer_location_visible) dokunmaz.
//
// Kullanım:
//   set -a; source .env.local; set +a; node scripts/seed-kurumsal-nailport.mjs
import { createClient } from "@supabase/supabase-js";

const TENANT_ID = "10eb69b7-ab0e-431c-8bf7-8849dae93e22"; // subdomain: nailport
const ADDRESS = "Sarısu Mah. 160 Sok. Tunç Plaza No: 5/10I, Konyaaltı / Antalya";

const content = {
  sector: "kozmetik",
  eyebrow: "Profesyonel Tırnak Bakım Ürünleri",
  headline: "Profesyonelin Tercihi.",
  tagline:
    "UV LED lambadan freze uçlarına, Staleks aletlerden nail art ürünlerine; salonlara ve bayilere toptan tedarik, Antalya'dan Türkiye'nin dört bir yanına.",
  about: [
    "Nailport, 2018'den bu yana tırnak ve güzellik sektöründe faaliyet gösteren ABA Kozmetik'in toptan satış markasıdır. Antalya merkezli olarak manikür, pedikür ve protez tırnak alanında profesyonel salonlara, eğitmenlere ve bayilere hizmet veriyoruz.",
    "Cihazlarımızın ve sarf malzemelerimizin büyük bölümünü doğrudan kendimiz ithal ediyoruz. Böylece Staleks, SNRQI, COMEUV, Kristall ve Kmiz gibi sektörün güvendiği markaları aracı maliyeti olmadan, tek çatı altında sunabiliyoruz.",
    "Satışlarımızı bayi ve toptan kanalıyla yapıyoruz. Bayilerimiz güncel fiyat listemize ve 2.000'i aşkın ürünlük kataloğumuza bayi portalımız üzerinden 7/24 ulaşır, siparişlerini birkaç dokunuşla WhatsApp'tan iletir.",
  ],
  phone: "+90 554 007 07 47",
  founded_year: 2018,
  city: "Antalya",
  customer_type: "bayi",
  highlights: [
    {
      title: "Doğrudan İthalat",
      body: "Cihaz ve sarf malzemelerinin büyük kısmını kendimiz ithal ediyor, aracısız fiyat sunuyoruz.",
    },
    {
      title: "Seçkin Markalar",
      body: "Staleks, SNRQI, COMEUV, Kristall, Kmiz ve daha fazlası tek tedarikçide.",
    },
    {
      title: "2.000+ Ürün",
      body: "UV LED lambadan freze uçlarına, stamping plakadan tırnak stickerlarına geniş katalog.",
    },
    {
      title: "WhatsApp ile Hızlı Sipariş",
      body: "Katalogdan sepetinizi oluşturun, siparişinizi tek dokunuşla WhatsApp'tan iletin.",
    },
  ],
  badge: { value: "2018", label: "Yılından Beri" },
  // null: kapı markası (public/gate/nailport/bg.jpg, #FF7F00) kullanılır.
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

const { error: addressError } = await supabase
  .from("tenant_storefront_settings")
  .update({ footer_location: ADDRESS })
  .eq("tenant_id", TENANT_ID);
if (addressError) {
  console.error("Adres hatası:", addressError.message);
  process.exit(1);
}

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
