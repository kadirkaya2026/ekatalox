alter table public.products
  add column if not exists is_discount_active boolean not null default false,
  add column if not exists discount_price numeric(12, 2);
