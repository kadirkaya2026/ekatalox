-- Bayi müşterisinin ek teslimat adresleri (8 Eki 2026, vitrin "Hesabım" — önce Lucatech).
-- Varsayılan adres eskisi gibi customer_address/customer_city sütunlarında kalır
-- (panel Müşteriler sayfası ve fiş onu okur); ek adresler bu dizide:
-- [{ "id": uuid, "label": "Depo", "address": "...", "city": "..." }]
alter table public.access_codes
  add column if not exists customer_addresses jsonb not null default '[]'::jsonb;
