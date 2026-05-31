alter table public.tenants
  add column if not exists is_whatsapp_order_direct boolean not null default true;
