-- Tenant admin panel ziyaretleri (6 Eki 2026): Supabase last_sign_in_at yalnız
-- şifreyle girişte güncellenir; açık oturumla girenler görünmüyordu. Panel her
-- açıldığında ve açık kaldıkça ping atar; 30 dk'dan uzun ara yeni ziyaret sayılır.
create table if not exists public.panel_visits (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  user_id uuid not null,
  started_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  page_views integer not null default 1,
  last_path text,
  user_agent text
);

create index if not exists panel_visits_tenant_started_idx
  on public.panel_visits (tenant_id, started_at desc);
create index if not exists panel_visits_user_seen_idx
  on public.panel_visits (user_id, last_seen_at desc);

alter table public.panel_visits enable row level security;

alter table public.tenants
  add column if not exists last_panel_seen_at timestamptz;

create or replace function public.record_panel_visit(
  p_tenant_id uuid,
  p_user_id uuid,
  p_path text,
  p_user_agent text,
  p_is_page_view boolean default true
) returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  select id into v_id
  from panel_visits
  where user_id = p_user_id
    and tenant_id = p_tenant_id
    and last_seen_at > now() - interval '30 minutes'
  order by last_seen_at desc
  limit 1;

  if v_id is null then
    insert into panel_visits (tenant_id, user_id, last_path, user_agent)
    values (p_tenant_id, p_user_id, left(p_path, 300), left(p_user_agent, 400));
  else
    update panel_visits
    set last_seen_at = now(),
        page_views = page_views + case when p_is_page_view then 1 else 0 end,
        last_path = coalesce(left(p_path, 300), last_path)
    where id = v_id;
  end if;

  update tenants set last_panel_seen_at = now() where id = p_tenant_id;
end;
$$;

revoke all on function public.record_panel_visit(uuid, uuid, text, text, boolean) from public, anon, authenticated;
