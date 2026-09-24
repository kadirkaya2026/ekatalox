-- 0134 Kurumsal site alan adı (25 Eyl 2026)
-- Kurumsal site (bkz. 0133) artık yalnız tenant'ın KENDİ kök alan adında
-- yayınlanır (ör. lucatech.com.tr); sipariş/katalog ekranı custom_domain
-- (ör. toptan.lucatech.com.tr) ya da {sub}.ekatalox.com'da kalır.
-- Değer normalize saklanır: küçük harf, şema/yol yok, baştaki "www." yok
-- (www.alanadi.com proxy'de kök alan adına 301 edilir).

alter table public.tenants add column if not exists kurumsal_domain text;

create unique index if not exists tenants_kurumsal_domain_unique_idx
  on public.tenants (lower(kurumsal_domain))
  where kurumsal_domain is not null;
