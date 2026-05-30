create table if not exists public.order_receipts (
  id              uuid primary key default gen_random_uuid(),
  secure_pdf_id   uuid not null unique default gen_random_uuid(),
  tenant_id       uuid not null references public.tenants(id) on delete cascade,
  order_number    text not null,
  storage_path    text not null,
  pdf_public_url  text not null,
  created_at      timestamptz not null default now(),
  expires_at      timestamptz not null default (now() + interval '24 hours')
);

create index if not exists order_receipts_tenant_id_idx
  on public.order_receipts (tenant_id);

create index if not exists order_receipts_expires_at_idx
  on public.order_receipts (expires_at);

alter table public.order_receipts enable row level security;
