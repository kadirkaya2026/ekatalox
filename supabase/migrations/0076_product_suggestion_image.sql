-- Süper admin bir ürün önerisini onaylamadan önce ad/fiyat/barkodu
-- düzeltebiliyor ve bir görsel ekleyebiliyor (kullanıcı isteği, 19 Ağu
-- 2026) — bu alan onay ekranında yüklenen görseli, onaylanana kadar
-- (product_suggestions satırı kalıcı olmadan önce) tutmak için.
alter table public.product_suggestions
  add column if not exists image_url text;
