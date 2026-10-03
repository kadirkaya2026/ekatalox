-- Perakende/ev yapımı mağaza ayarları (3 Eki 2026, ilk: ayfer-in-ikramliklari).
-- Tek jsonb: bilgi bölümleri (anasayfa), teslim tarihi kuralı (sepette tarih,
-- en erken N gün sonrası; belirli kategorilerde daha uzun), "Menünü Oluştur"
-- (N çeşit + kişi sayısı → fiyat teklifi isteği). Boşsa hiçbir şey değişmez.
alter table public.tenant_storefront_settings
  add column if not exists retail_config jsonb;
