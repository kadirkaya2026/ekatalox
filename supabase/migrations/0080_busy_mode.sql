-- "Yoğunluk modu" (kullanıcı isteği, 21 Ağu 2026): bayi tek tuşla açınca
-- vitrini ilk açan müşteriye "şu anda yoğunuz, siparişiniz gecikebilir"
-- uyarısı çıkar.
--
-- Mevcut duyuru alanları (announcement_title/body) BİLEREK kullanılmadı:
-- yoğunluk geçici bir durum, sabah aç akşam kapat. Duyuruyu kullansaydık
-- her açıp kapatışta bayinin kalıcı duyuru metni silinirdi.
alter table public.tenant_storefront_settings
  add column if not exists is_busy_mode boolean not null default false,
  add column if not exists busy_mode_note text;
