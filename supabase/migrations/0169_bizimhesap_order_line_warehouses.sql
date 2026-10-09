-- Onay penceresinde satır başına BizimHesap deposu (9 Eki 2026, Lucatech):
-- { "<order.items dizinindeki sıra>": "<depo kimliği>" | "" }. Anahtar yoksa ürünün
-- varsayılan deposu (products.bizimhesap_warehouse_id, 0168); "" = BizimHesap varsayılanı.
alter table public.orders
  add column if not exists bizimhesap_line_warehouses jsonb;
