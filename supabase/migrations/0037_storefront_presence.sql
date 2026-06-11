-- Storefront real-time presence: tracks the last activity of each logged-in
-- visitor so reports can show "who is online now" grouped by price list.
-- One row per (tenant, visitor); heartbeat upserts last_seen_at + current list.

create table if not exists public.storefront_presence (
  tenant_id     uuid not null references public.tenants(id) on delete cascade,
  visitor_key   text not null,
  price_list_id uuid references public.price_lists(id) on delete set null,
  last_seen_at  timestamptz not null default now(),
  primary key (tenant_id, visitor_key)
);

create index if not exists storefront_presence_tenant_seen_idx
  on public.storefront_presence (tenant_id, last_seen_at);

alter table public.storefront_presence enable row level security;

create policy "tenant admin read own presence"
  on public.storefront_presence
  for select
  using (public.is_tenant_member(tenant_id));

-- Heartbeat: upsert the visitor's freshness + current price list. Opportunistically
-- prunes rows older than 15 minutes for this tenant so the table stays bounded.
create or replace function public.record_storefront_presence(
  p_tenant_id uuid,
  p_visitor_key text,
  p_price_list_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_visitor_key is null or length(trim(p_visitor_key)) = 0 then
    return;
  end if;

  insert into public.storefront_presence (tenant_id, visitor_key, price_list_id, last_seen_at)
  values (p_tenant_id, p_visitor_key, p_price_list_id, now())
  on conflict (tenant_id, visitor_key)
  do update set
    price_list_id = excluded.price_list_id,
    last_seen_at = now();

  delete from public.storefront_presence
  where tenant_id = p_tenant_id
    and last_seen_at < now() - interval '15 minutes';
end;
$$;

revoke all on function public.record_storefront_presence(uuid, text, uuid) from public;
