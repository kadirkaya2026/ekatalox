-- 29 Eyl 2026 (kullanıcı kararı): mağaza başka sektörün temasını da seçebilir.
-- Tema kimliği bilinen bir sektör önekine sahip olmalı (electronics-, food-, …);
-- mağazanın kayıtlı sektörüyle eşleşme şartı kalktı (bkz. 0146).
create or replace function public.validate_sector_design() returns trigger
language plpgsql set search_path = public as $$
declare
  theme_prefix text;
begin
  if new.sector_design is null then return new; end if;
  theme_prefix := split_part(coalesce(new.sector_design->>'themeId', ''), '-', 1);
  if theme_prefix not in ('electronics', 'food', 'textile', 'hardware', 'cosmetics', 'stationery',
                          'packaging', 'electricity', 'homeware', 'automotive', 'general')
     or new.sector_design->>'version' is distinct from '1'
     or coalesce(new.sector_design->>'mode', '') not in ('retail', 'wholesale')
     or jsonb_typeof(new.sector_design->'content') is distinct from 'object' then
    raise exception 'Invalid sector design';
  end if;
  return new;
end;
$$;
