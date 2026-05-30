alter table public.tenant_storefront_settings
  add column if not exists footer_website_url text,
  add column if not exists is_footer_website_visible boolean not null default false,
  add column if not exists footer_phone text,
  add column if not exists footer_email text,
  add column if not exists is_footer_contact_visible boolean not null default false;
