-- Paket limiti üstündeki ürünler (3 Eki 2026): mağaza Ücretsiz'e düşünce ürün
-- sayısı limiti aşıyorsa EN SON eklenen fazlalık ürünler silinmez, yalnız
-- vitrinde gizlenir (is_over_limit=true); yönetim panelinde görünmeye devam eder.
-- Paket yükseltilince lib/products/limit.ts yeniden hesaplayıp açar.
alter table public.products
  add column if not exists is_over_limit boolean not null default false;
create index if not exists products_over_limit_idx
  on public.products (tenant_id) where is_over_limit;
