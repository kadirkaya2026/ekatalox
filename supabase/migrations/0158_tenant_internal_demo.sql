-- Süper admin "Demo Mağazalar" sekmesi (6 Eki 2026): bizim açtığımız tanıtım
-- mağazaları müşteri listesinden ayrılır. is_demo'dan BAĞIMSIZ (is_demo bildirimi kapatır).
alter table public.tenants
  add column if not exists is_internal_demo boolean not null default false;

update public.tenants set is_internal_demo = true
where subdomain in (
  'demo', 'demo-giyim', 'demo-elektronik', 'demo-gida', 'demo-yapimarket',
  'demo-evyasam', 'demo-kozmetik', 'demotoptan', 'marketgo', 'tekelsiparis', 'mahalleden'
);
