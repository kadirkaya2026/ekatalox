-- Dönüşüm olayları tıklama/sayfa sayaçlarını artırmaz. Form değerleri tutulmaz.
create table public.site_funnel_events (
  id bigint generated always as identity primary key,
  visitor_key text not null,
  session_key text not null,
  event_name text not null check (event_name in ('demo_open','signup_cta','signup_start','signup_business_complete','signup_whatsapp_complete','signup_submit','signup_error','signup_complete')),
  path text not null,
  plan text check (plan in ('free','starter','professional','corporate')),
  created_at timestamptz not null default now()
);
create index site_funnel_created_idx on public.site_funnel_events(created_at);
alter table public.site_funnel_events enable row level security;
revoke all on public.site_funnel_events from anon, authenticated;
grant all on public.site_funnel_events to service_role;
grant usage, select on sequence public.site_funnel_events_id_seq to service_role;

create function public.site_analytics_funnel(p_from timestamptz, p_to timestamptz)
returns table(event_name text, visitors bigint, events bigint)
language sql stable security definer set search_path = public as $$
  select event_name, count(distinct visitor_key), count(*)
  from public.site_funnel_events where created_at >= p_from and created_at < p_to
  group by event_name;
$$;
revoke all on function public.site_analytics_funnel(timestamptz,timestamptz) from public, anon, authenticated;
grant execute on function public.site_analytics_funnel(timestamptz,timestamptz) to service_role;

-- Mevcut günlük cron aynı saklama süresini yeni olaylara da uygular.
create or replace function public.site_analytics_prune(p_keep_days integer default 180)
returns integer language plpgsql security definer set search_path = public as $$
declare base_count integer; funnel_count integer;
begin
  delete from public.site_events where created_at < now() - make_interval(days => greatest(30, p_keep_days));
  get diagnostics base_count = row_count;
  delete from public.site_funnel_events where created_at < now() - make_interval(days => greatest(30, p_keep_days));
  get diagnostics funnel_count = row_count;
  return base_count + funnel_count;
end;
$$;
revoke all on function public.site_analytics_prune(integer) from public, anon, authenticated;
grant execute on function public.site_analytics_prune(integer) to service_role;
