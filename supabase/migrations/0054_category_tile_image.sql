alter table public.categories
  add column if not exists tile_image_url text;
