-- BizimHesap deposu (9 Eki 2026, Lucatech isteği): ürün satışta hangi depodan
-- fişlensin (ör. Camlar → "Kırılmaz Cam Bahçelievler"). BizimHesap depo kimliği
-- (warehouses servisi). Boşsa BizimHesap'ın varsayılan deposu kullanılır.
-- Ürün düzeyinde: varyantlar (telefon modelleri) aynı depodan çıkar.
alter table public.products
  add column if not exists bizimhesap_warehouse_id text;
