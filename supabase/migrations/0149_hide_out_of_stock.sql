-- Stokta olmayan ürünler vitrinde gizlensin mi (30 Eyl 2026, Autovale isteği).
-- Ayarlar → Stokta Olmayan Ürünler'den seçilir; varsayılan göster (eski davranış).
alter table public.tenants
  add column if not exists hide_out_of_stock boolean not null default false;
