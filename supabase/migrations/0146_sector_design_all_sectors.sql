-- 0143'teki doğrulama yalnız telefon-aksesuar (electronics-*) temalarını kabul
-- ediyordu; gıda/tekstil/hırdavat/kozmetik temaları kodda açılınca bu
-- sektörlerde kayıt tetikleyiciye takılıyordu (28 Eyl 2026, "Zeki iletsim").
-- Tema kimliğinin öneki mağazanın sektörüyle eşleşmeli; yeni sektör temaları
-- (kırtasiye, ambalaj, elektrik, ev-mutfak, yedek parça, genel) da kapsanır.
create or replace function public.validate_sector_design() returns trigger
language plpgsql set search_path = public as $$
declare
  registered_sector text;
  theme_prefix text;
  expected_sector text;
begin
  if new.sector_design is null then return new; end if;
  select sector into registered_sector from public.tenants where id = new.tenant_id;
  theme_prefix := split_part(coalesce(new.sector_design->>'themeId', ''), '-', 1);
  expected_sector := case theme_prefix
    when 'electronics' then 'telefon-aksesuar'
    when 'food' then 'gida'
    when 'textile' then 'tekstil'
    when 'hardware' then 'hirdavat'
    when 'cosmetics' then 'kozmetik'
    when 'stationery' then 'kirtasiye-oyuncak'
    when 'packaging' then 'ambalaj'
    when 'electricity' then 'elektrik'
    when 'homeware' then 'ev-mutfak'
    when 'automotive' then 'yedek-parca'
    when 'general' then 'diger'
    else null
  end;
  if expected_sector is null
     or registered_sector is distinct from expected_sector
     or new.sector_design->>'version' is distinct from '1'
     or coalesce(new.sector_design->>'mode', '') not in ('retail', 'wholesale')
     or jsonb_typeof(new.sector_design->'content') is distinct from 'object' then
    raise exception 'Invalid design for registered tenant sector';
  end if;
  return new;
end;
$$;
