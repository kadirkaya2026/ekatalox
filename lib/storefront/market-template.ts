import { createSupabaseAdminClient } from "@/lib/supabase/admin";

// Yeni market tenant'lar açılırken "referans" alınan mağaza (kullanıcı
// isteği, 4 Eyl 2026: "tekelsiparis'in teması/ayarları bundan sonra
// açtığım tüm market mağazalarda otomatik gelsin"). tekelsiparis kendi
// ayarlarını değiştirdikçe SONRAKİ yeni mağazalar da otomatik onu takip
// eder — kopya statik değil, oluşturma anında canlı okunur.
export const MARKET_DESIGN_TEMPLATE_SUBDOMAIN = "tekelsiparis";

// Kopyalanan "tasarım/davranış" alanları. Kasıtlı olarak DIŞARIDA bırakılan
// alanlar: mağaza adı/açıklaması, logo, hero/banner görselleri, footer
// iletişim bilgisi/saatler, duyuru, kampanya rakamları, min sepet tutarı,
// getirme ücreti — bunlar tekelsiparis'e özel İÇERİK; kopyalanırsa yeni
// mağaza ilk açıldığında tekelsiparis'in kendi bilgilerini gösterirdi
// (kullanıcı "sadece tasarım/davranış şablonu" seçti, içerik hariç).
const MARKET_DESIGN_FIELDS = [
  "theme_key",
  "layout_key",
  "hero_style_key",
  "brand_primary_color",
  "brand_accent_color",
  "font_key",
  "product_card_style",
  "product_image_background",
  "header_style_key",
  "footer_style_key",
  "homepage_blocks",
  "is_hero_cluster_visible_on_mobile",
  "card_installment_options",
  "is_theme_toggle_visible",
  "is_logout_button_visible",
  "recommendation_mode",
  "default_locale",
  "is_best_sellers_visible",
  "best_sellers_title",
  "best_sellers_product_count",
] as const;

/**
 * Yeni bir market tenant'ı (business_type = "market") oluşturulunca
 * çağrılır: tekelsiparis'in GÜNCEL tasarım/davranış ayarlarını yeni
 * tenant'a kopyalar (satır yoksa insert; DB default'ları geri kalan
 * kolonları — logo, hero, footer içeriği vb. — nötr varsayılana bırakır).
 * Şablon bulunamazsa veya kopya başarısız olursa SESSİZCE vazgeçer — tenant
 * oluşturma akışını asla bozmaz, mağaza genel varsayılanlarla açılır.
 */
export async function seedMarketStorefrontTemplate(
  supabase: NonNullable<ReturnType<typeof createSupabaseAdminClient>>,
  newTenantId: string,
): Promise<void> {
  try {
    const { data: templateTenant } = await supabase
      .from("tenants")
      .select("id")
      .eq("subdomain", MARKET_DESIGN_TEMPLATE_SUBDOMAIN)
      .maybeSingle();

    if (!templateTenant) return;

    const { data: templateSettings } = await supabase
      .from("tenant_storefront_settings")
      .select(MARKET_DESIGN_FIELDS.join(", "))
      .eq("tenant_id", templateTenant.id)
      .maybeSingle();

    if (!templateSettings) return;

    await supabase.from("tenant_storefront_settings").insert({
      tenant_id: newTenantId,
      ...(templateSettings as unknown as Record<string, unknown>),
    });
  } catch {
    // Şablon kopyalanamasa da tenant oluşturma akışı bozulmasın.
  }
}
