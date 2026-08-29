-- Bayi (tenant admin) push abonelikleri: yeni sipariş / müşteri iptali bildirimi.
-- Aynı hesaba giren her cihaz ayrı satır; endpoint benzersiz. Yalnız service
-- role yazar/okur (RLS açık, politika yok) — API tenant_id'yi oturumdan alır.
create table if not exists public.dealer_push_subscriptions (
  id            uuid primary key default gen_random_uuid(),
  tenant_id     uuid not null references public.tenants(id) on delete cascade,
  profile_id    uuid references public.profiles(id) on delete set null,
  endpoint      text not null unique,
  p256dh        text not null,
  auth          text not null,
  user_agent    text,
  failure_count integer not null default 0,
  created_at    timestamptz not null default now(),
  last_used_at  timestamptz
);
create index if not exists dealer_push_subscriptions_tenant_idx
  on public.dealer_push_subscriptions (tenant_id);
alter table public.dealer_push_subscriptions enable row level security;
notify pgrst, 'reload schema';
