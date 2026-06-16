alter table public.categories
  add column if not exists banner_item jsonb default null;

alter table public.categories
  add constraint categories_banner_item_is_object
  check (banner_item is null or jsonb_typeof(banner_item) = 'object');
