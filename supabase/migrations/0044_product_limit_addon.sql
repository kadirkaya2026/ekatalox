-- Süper admin bir tenant'a plan tabanının üzerine "hediye" ürün kapasitesi
-- tanımlayabilir (ör. 500 ürünlük pakete +250 hediye). max_product_limit
-- plan'a sıkı bağlı kaldığı için (tenants_plan_limit_consistency_check),
-- hediye kapasite ayrı bir kolonda tutulur; efektif limit uygulama
-- kodunda max_product_limit + product_limit_addon olarak hesaplanır.
alter table public.tenants
  add column if not exists product_limit_addon integer not null default 0
    check (product_limit_addon >= 0);
