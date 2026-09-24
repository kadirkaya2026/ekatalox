-- Devredilen basılı magnetler: bir baskı paketinin kodları BAŞKA BİR
-- KURULUMDAKİ bayiye yönlendirilebilsin.
--
-- Neden gerekti: tekel/market işi ayrı bir kuruluma devredildi ama magnetler
-- ekatalox.com/t/{kod} yazılı olarak basıldı ve kart yıllarca buzdolabında
-- duruyor. Kodu bir bayiye atamak burada işe yaramıyor — hedef bayi bu
-- kurulumda yok, atama listesinde hiç görünmüyor.
--
-- Çözüm tenant_id'ye DOKUNMAYAN bir üst geçiş: partner_redirect_url doluysa
-- /t/{kod} ziyaretçiyi oraya yollar. Alan boşaltılınca eski davranış aynen
-- geri gelir; atama, sahiplenme ve okutma geçmişi hiçbir noktada silinmez.
-- Yönlendirmenin süresi de böyle yönetiliyor, ayrı bir iptal mekanizması yok.

alter table public.magnet_codes
  add column if not exists partner_redirect_url text;

comment on column public.magnet_codes.partner_redirect_url is
  'Dolu ise /t/{kod} bu adrese yönlendirir (başka kurulumdaki bayi). tenant_id korunur, boşaltılınca eski davranış döner.';

-- assign_magnet_packages (0109) ile aynı şekli taşıyor ama iki farkı var:
--   1) Yalnız sahipsiz kodlara değil, paketteki TÜM kodlara uygulanır —
--      devredilen partide zaten bir bayiye atanmış kartlar da var.
--   2) Hiçbir şeyi ezmez: tenant_id olduğu gibi kalır, sadece üst geçiş
--      yazılır. Bu yüzden ön izleme/uyarı akışına da ihtiyaç duymuyor.
create or replace function public.set_magnet_package_partner(
  p_package_codes text[],
  p_url text
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer;
  v_url text := nullif(btrim(coalesce(p_url, '')), '');
begin
  if p_package_codes is null or array_length(p_package_codes, 1) is null then
    raise exception 'en az bir paket kodu gerekli';
  end if;

  -- Yalnız http(s): /t/{kod} bu değeri doğrudan Location başlığına yazıyor,
  -- javascript: gibi bir şemaya izin vermek açık kapı olurdu.
  if v_url is not null and v_url !~* '^https?://' then
    raise exception 'adres http:// veya https:// ile başlamalı';
  end if;

  update public.magnet_codes
     set partner_redirect_url = v_url
   where package_code = any (p_package_codes);

  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

revoke all on function public.set_magnet_package_partner(text[], text) from public;

-- Panelin paket ızgarasında "bu kutu dışarı yönlendirilmiş" rozetini
-- gösterebilmesi için özet. magnet_package_summary (0101) genişletilmedi:
-- dönüş tipini değiştirmek onu önce DROP etmeyi gerektirirdi ve o fonksiyon
-- canlı sayfada çalışıyor. Ayrı, küçük bir fonksiyon daha ucuz.
create or replace function public.magnet_package_partner_summary()
returns table (
  package_code text,
  partner integer,
  partner_url text
)
language sql
stable
security definer
set search_path = public
as $$
  select c.package_code,
         count(*) filter (where c.partner_redirect_url is not null)::integer,
         -- Adres paket başına yazıldığı için paket içindeki değerler aynı;
         -- max() elle değiştirilmiş tek tük satır olsa bile bir tanesini verir.
         max(c.partner_redirect_url)
    from public.magnet_codes c
   where c.package_code is not null
   group by c.package_code
   order by c.package_code;
$$;

revoke all on function public.magnet_package_partner_summary() from public;

notify pgrst, 'reload schema';
