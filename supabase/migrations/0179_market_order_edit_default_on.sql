-- Market mağazalarında sipariş fişi düzenleme varsayılan açık (17 Eki 2026).
-- Müşteri sipariş verdikten sonra stokta olmayan ürün çıkarılabilsin, adet/fiyat
-- değiştirilebilsin diye toptancıdaki "Düzenle" market tenantlarına da açıldı.
-- Bir mağazada kapatmak gerekirse: update tenants set order_edit_enabled = false where subdomain = '...';
alter table public.tenants alter column order_edit_enabled set default true;

update public.tenants set order_edit_enabled = true
 where business_type = 'market' and order_edit_enabled = false;
