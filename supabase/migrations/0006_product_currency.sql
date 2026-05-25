alter table public.products
  add column if not exists currency text;

update public.products
set currency = 'TRY'
where currency is null or btrim(currency) = '';

alter table public.products
  alter column currency set default 'TRY';

alter table public.products
  alter column currency set not null;

alter table public.products
  drop constraint if exists products_currency_check;

alter table public.products
  add constraint products_currency_check
  check (currency in ('TRY', 'USD', 'EUR'));