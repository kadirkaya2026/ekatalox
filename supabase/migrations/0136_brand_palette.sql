-- 0136 Buton / bölüm bazlı marka renkleri (25 Eyl 2026)
-- Tenant artık her butonu (sepete ekle, adet sayacı, alttaki sepet çubuğu,
-- WhatsApp ile siparişi tamamla, Mağaza'ya Gir, üstteki sepet, kampanya
-- butonları), yazı/rozetleri (fiyat, seçili kategori, varyant, indirim) ve
-- bölüm zeminlerini (üst bar, alt bilgi, sayfa) ayrı renklendirebilir.
-- Biçim: {"addToCart":"#16a34a","headerBg":"#0f172a", ...}; yalnız
-- ayarlanmış roller bulunur. Anahtar listesi: lib/storefront/brand-palette.ts.
-- Boş rol → brand_primary_color / brand_accent_color → temanın rengi.

alter table public.tenant_storefront_settings
  add column if not exists brand_palette jsonb not null default '{}'::jsonb;
