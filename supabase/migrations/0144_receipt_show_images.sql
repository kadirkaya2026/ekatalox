-- Sipariş fişinde (PDF) ürün görselleri gösterilsin mi (28 Eyl 2026).
-- Ayarlar → Sipariş Fişi'nden seçilir; varsayılan resimli.
alter table public.tenants
  add column if not exists receipt_show_images boolean not null default true;
