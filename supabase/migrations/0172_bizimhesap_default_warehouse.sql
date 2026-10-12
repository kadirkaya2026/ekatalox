-- BizimHesap varsayılan depo (12 Eki 2026, Lucatech): depo seçilmemiş satırlar
-- BizimHesap'a alansız gidince BizimHesap bir önceki satırın deposunu uyguluyordu
-- (camdan sonraki ürünler cam deposuna düşüyordu). Artık her satıra açık depo
-- gönderilir; ürün/sipariş deposu yoksa bu depo. Boşsa eski davranış sürer.
alter table public.tenant_bizimhesap
  add column if not exists default_warehouse_id text;
