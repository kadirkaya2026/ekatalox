-- Pazarlama sitesi (ekatalox.com) ziyaretçi analitiği (kullanıcı isteği, 7 Eyl 2026).
--
-- Süper admin "kaç kişi girdi, hangi sayfalara baktı, ne kadar durdu, nereye
-- tıkladı, nereden döndü" sorularına kişi kişi ve gün/hafta/ay bazında cevap
-- alabilsin diye HAM olay günlüğü tutulur (vitrin analitiğindeki günlük
-- toplamların aksine). Yalnızca pazarlama alan adı izlenir; tenant vitrinleri,
-- bayi paneli ve admin paneli izlenmez (bkz. components/site-analytics/).
--
-- Tüm yazma/okuma service role ile (RPC + admin client); anon erişim yok.

create table if not exists public.site_visitors (
  id               uuid primary key default gen_random_uuid(),
  visitor_key      text not null unique,
  first_seen_at    timestamptz not null default now(),
  last_seen_at     timestamptz not null default now(),
  session_count    integer not null default 0,
  pageview_count   integer not null default 0,
  first_landing_path text,
  first_referrer_host text,
  last_country     text,
  last_city        text,
  last_device      text,
  last_browser     text,
  last_os          text,
  note             text
);

create table if not exists public.site_sessions (
  id               uuid primary key default gen_random_uuid(),
  session_key      text not null unique,
  visitor_id       uuid not null references public.site_visitors(id) on delete cascade,
  started_at       timestamptz not null default now(),
  last_seen_at     timestamptz not null default now(),
  duration_ms      integer not null default 0,
  pageview_count   integer not null default 0,
  click_count      integer not null default 0,
  entry_path       text,
  exit_path        text,
  referrer         text,
  referrer_host    text,
  utm_source       text,
  utm_medium       text,
  utm_campaign     text,
  device           text,
  browser          text,
  os               text,
  screen           text,
  country          text,
  city             text
);

create table if not exists public.site_events (
  id               bigint generated always as identity primary key,
  session_id       uuid not null references public.site_sessions(id) on delete cascade,
  visitor_id       uuid not null references public.site_visitors(id) on delete cascade,
  event_type       text not null check (event_type in ('pageview', 'click', 'leave')),
  path             text not null,
  page_title       text,
  target_text      text,
  target_href      text,
  target_tag       text,
  scroll_pct       smallint,
  time_on_page_ms  integer,
  created_at       timestamptz not null default now()
);

create index if not exists site_visitors_last_seen_idx on public.site_visitors (last_seen_at desc);
create index if not exists site_sessions_started_idx on public.site_sessions (started_at desc);
create index if not exists site_sessions_visitor_idx on public.site_sessions (visitor_id, started_at desc);
create index if not exists site_events_created_idx on public.site_events (created_at desc);
create index if not exists site_events_session_idx on public.site_events (session_id, created_at);
create index if not exists site_events_path_idx on public.site_events (path, created_at desc);

alter table public.site_visitors enable row level security;
alter table public.site_sessions enable row level security;
alter table public.site_events enable row level security;

-- ---------------------------------------------------------------------------
-- Kayıt: tek çağrıda ziyaretçi + oturum upsert, sayaçlar, olay satırı.
-- ---------------------------------------------------------------------------
create or replace function public.record_site_event(
  p_visitor_key text,
  p_session_key text,
  p_event_type text,
  p_path text,
  p_title text default null,
  p_referrer text default null,
  p_referrer_host text default null,
  p_utm_source text default null,
  p_utm_medium text default null,
  p_utm_campaign text default null,
  p_device text default null,
  p_browser text default null,
  p_os text default null,
  p_screen text default null,
  p_country text default null,
  p_city text default null,
  p_target_text text default null,
  p_target_href text default null,
  p_target_tag text default null,
  p_scroll_pct integer default null,
  p_time_on_page_ms integer default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_visitor_id uuid;
  v_session_id uuid;
  v_session_started timestamptz;
begin
  if p_visitor_key is null or length(trim(p_visitor_key)) = 0
     or p_session_key is null or length(trim(p_session_key)) = 0
     or p_event_type not in ('pageview', 'click', 'leave')
     or p_path is null then
    return;
  end if;

  insert into public.site_visitors (
    visitor_key, first_landing_path, first_referrer_host,
    last_country, last_city, last_device, last_browser, last_os
  )
  values (
    p_visitor_key, p_path, p_referrer_host,
    p_country, p_city, p_device, p_browser, p_os
  )
  on conflict (visitor_key) do update set
    last_seen_at = now(),
    last_country = coalesce(excluded.last_country, site_visitors.last_country),
    last_city    = coalesce(excluded.last_city, site_visitors.last_city),
    last_device  = coalesce(excluded.last_device, site_visitors.last_device),
    last_browser = coalesce(excluded.last_browser, site_visitors.last_browser),
    last_os      = coalesce(excluded.last_os, site_visitors.last_os)
  returning id into v_visitor_id;

  insert into public.site_sessions (
    session_key, visitor_id, entry_path, exit_path,
    referrer, referrer_host, utm_source, utm_medium, utm_campaign,
    device, browser, os, screen, country, city
  )
  values (
    p_session_key, v_visitor_id, p_path, p_path,
    p_referrer, p_referrer_host, p_utm_source, p_utm_medium, p_utm_campaign,
    p_device, p_browser, p_os, p_screen, p_country, p_city
  )
  on conflict (session_key) do nothing
  returning id, started_at into v_session_id, v_session_started;

  if v_session_id is null then
    select id, started_at into v_session_id, v_session_started
    from public.site_sessions where session_key = p_session_key;
  else
    update public.site_visitors set session_count = session_count + 1 where id = v_visitor_id;
  end if;

  -- Oturum başka bir ziyaretçiye aitse (anahtar çakışması) yazma.
  if not exists (
    select 1 from public.site_sessions where id = v_session_id and visitor_id = v_visitor_id
  ) then
    return;
  end if;

  update public.site_sessions set
    last_seen_at   = now(),
    duration_ms    = greatest(0, (extract(epoch from (now() - v_session_started)) * 1000)::integer),
    exit_path      = case when p_event_type in ('pageview', 'leave') then p_path else exit_path end,
    pageview_count = pageview_count + case when p_event_type = 'pageview' then 1 else 0 end,
    click_count    = click_count + case when p_event_type = 'click' then 1 else 0 end
  where id = v_session_id;

  if p_event_type = 'pageview' then
    update public.site_visitors set pageview_count = pageview_count + 1 where id = v_visitor_id;
  end if;

  insert into public.site_events (
    session_id, visitor_id, event_type, path, page_title,
    target_text, target_href, target_tag, scroll_pct, time_on_page_ms
  )
  values (
    v_session_id, v_visitor_id, p_event_type, p_path, p_title,
    p_target_text, p_target_href, p_target_tag,
    case when p_scroll_pct is null then null else least(100, greatest(0, p_scroll_pct))::smallint end,
    case when p_time_on_page_ms is null then null else least(7200000, greatest(0, p_time_on_page_ms)) end
  );
end;
$$;

-- ---------------------------------------------------------------------------
-- Raporlar. Aralık: [p_from, p_to) timestamptz (TS tarafı İstanbul gününü
-- 00:00+03:00 sınırlarına çevirir). Tümü security definer, admin client çağırır.
-- ---------------------------------------------------------------------------
create or replace function public.site_analytics_summary(p_from timestamptz, p_to timestamptz)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  with s as (
    select * from public.site_sessions where started_at >= p_from and started_at < p_to
  ),
  v as (
    select distinct visitor_id from s
  )
  select jsonb_build_object(
    'visitors', (select count(*) from v),
    'newVisitors', (select count(*) from v join public.site_visitors sv on sv.id = v.visitor_id
                    where sv.first_seen_at >= p_from and sv.first_seen_at < p_to),
    'sessions', (select count(*) from s),
    'pageviews', (select coalesce(sum(pageview_count), 0) from s),
    'clicks', (select coalesce(sum(click_count), 0) from s),
    'avgDurationMs', (select coalesce(avg(duration_ms), 0)::integer from s),
    'bounceRatePct', (select case when count(*) = 0 then null
                             else round(100.0 * count(*) filter (where pageview_count <= 1) / count(*), 1) end
                      from s),
    'pagesPerSession', (select case when count(*) = 0 then 0
                               else round(coalesce(sum(pageview_count), 0)::numeric / count(*), 2) end from s)
  );
$$;

create or replace function public.site_analytics_timeseries(p_from timestamptz, p_to timestamptz, p_bucket text)
returns table (bucket_start date, visitors integer, sessions integer, pageviews integer, avg_duration_ms integer)
language sql
stable
security definer
set search_path = public
as $$
  select
    date_trunc(case when p_bucket in ('day', 'week', 'month') then p_bucket else 'day' end,
               started_at at time zone 'Europe/Istanbul')::date as bucket_start,
    count(distinct visitor_id)::integer as visitors,
    count(*)::integer as sessions,
    coalesce(sum(pageview_count), 0)::integer as pageviews,
    coalesce(avg(duration_ms), 0)::integer as avg_duration_ms
  from public.site_sessions
  where started_at >= p_from and started_at < p_to
  group by 1
  order by 1;
$$;

create or replace function public.site_analytics_pages(p_from timestamptz, p_to timestamptz)
returns table (
  path text, pageviews integer, visitors integer, avg_time_ms integer,
  avg_scroll_pct integer, entries integer, exits integer, clicks integer
)
language sql
stable
security definer
set search_path = public
as $$
  with ev as (
    select * from public.site_events where created_at >= p_from and created_at < p_to
  ),
  pv as (
    select path, count(*)::integer as pageviews, count(distinct visitor_id)::integer as visitors
    from ev where event_type = 'pageview' group by path
  ),
  lv as (
    select path, sum(time_on_page_ms) as total_ms, avg(scroll_pct) as avg_scroll
    from ev where event_type = 'leave' group by path
  ),
  ck as (
    select path, count(*)::integer as clicks from ev where event_type = 'click' group by path
  ),
  ss as (
    select entry_path, exit_path from public.site_sessions where started_at >= p_from and started_at < p_to
  ),
  en as (select entry_path as path, count(*)::integer as entries from ss group by entry_path),
  ex as (select exit_path as path, count(*)::integer as exits from ss group by exit_path)
  select
    pv.path,
    pv.pageviews,
    pv.visitors,
    case when pv.pageviews = 0 then 0 else (coalesce(lv.total_ms, 0) / pv.pageviews)::integer end as avg_time_ms,
    coalesce(lv.avg_scroll, 0)::integer as avg_scroll_pct,
    coalesce(en.entries, 0) as entries,
    coalesce(ex.exits, 0) as exits,
    coalesce(ck.clicks, 0) as clicks
  from pv
  left join lv on lv.path = pv.path
  left join ck on ck.path = pv.path
  left join en on en.path = pv.path
  left join ex on ex.path = pv.path
  order by pv.pageviews desc, pv.path;
$$;

create or replace function public.site_analytics_referrers(p_from timestamptz, p_to timestamptz)
returns table (source text, sessions integer, visitors integer)
language sql
stable
security definer
set search_path = public
as $$
  select
    coalesce(nullif(utm_source, ''), nullif(referrer_host, ''), 'Doğrudan / yer imi') as source,
    count(*)::integer as sessions,
    count(distinct visitor_id)::integer as visitors
  from public.site_sessions
  where started_at >= p_from and started_at < p_to
  group by 1
  order by 2 desc, 1
  limit 50;
$$;

create or replace function public.site_analytics_clicks(p_from timestamptz, p_to timestamptz)
returns table (path text, target_text text, target_href text, clicks integer, visitors integer)
language sql
stable
security definer
set search_path = public
as $$
  select
    path,
    coalesce(nullif(target_text, ''), '(metinsiz)') as target_text,
    target_href,
    count(*)::integer as clicks,
    count(distinct visitor_id)::integer as visitors
  from public.site_events
  where event_type = 'click' and created_at >= p_from and created_at < p_to
  group by 1, 2, 3
  order by 4 desc
  limit 100;
$$;

create or replace function public.site_analytics_breakdown(p_from timestamptz, p_to timestamptz, p_dimension text)
returns table (label text, sessions integer, visitors integer)
language sql
stable
security definer
set search_path = public
as $$
  select
    coalesce(nullif(case p_dimension
      when 'device' then device
      when 'browser' then browser
      when 'os' then os
      when 'country' then country
      when 'city' then city
      else device end, ''), 'Bilinmiyor') as label,
    count(*)::integer as sessions,
    count(distinct visitor_id)::integer as visitors
  from public.site_sessions
  where started_at >= p_from and started_at < p_to
  group by 1
  order by 2 desc
  limit 20;
$$;

-- Ziyaretçi listesi: aralıkta oturumu olanlar, aralık içi toplamlarıyla.
create or replace function public.site_analytics_visitors(
  p_from timestamptz, p_to timestamptz, p_limit integer default 50, p_offset integer default 0
)
returns table (
  visitor_id uuid, visitor_key text, first_seen_at timestamptz, last_seen_at timestamptz,
  sessions integer, pageviews integer, clicks integer, total_duration_ms bigint,
  last_entry_path text, last_exit_path text, last_source text,
  country text, city text, device text, browser text, os text, note text,
  total_count bigint
)
language sql
stable
security definer
set search_path = public
as $$
  with s as (
    select * from public.site_sessions where started_at >= p_from and started_at < p_to
  ),
  agg as (
    select
      visitor_id,
      count(*)::integer as sessions,
      coalesce(sum(pageview_count), 0)::integer as pageviews,
      coalesce(sum(click_count), 0)::integer as clicks,
      coalesce(sum(duration_ms), 0)::bigint as total_duration_ms,
      max(started_at) as last_started_at
    from s group by visitor_id
  ),
  last_s as (
    select distinct on (visitor_id) visitor_id, entry_path, exit_path,
      coalesce(nullif(utm_source, ''), nullif(referrer_host, ''), 'Doğrudan') as source,
      country, city, device, browser, os
    from s order by visitor_id, started_at desc
  )
  select
    v.id, v.visitor_key, v.first_seen_at, v.last_seen_at,
    agg.sessions, agg.pageviews, agg.clicks, agg.total_duration_ms,
    last_s.entry_path, last_s.exit_path, last_s.source,
    last_s.country, last_s.city, last_s.device, last_s.browser, last_s.os, v.note,
    (select count(*) from agg) as total_count
  from agg
  join public.site_visitors v on v.id = agg.visitor_id
  join last_s on last_s.visitor_id = agg.visitor_id
  order by agg.last_started_at desc
  limit greatest(1, least(p_limit, 200)) offset greatest(0, p_offset);
$$;

-- Bakım: eski ham olayları sil (oturum/ziyaretçi özetleri kalır).
create or replace function public.site_analytics_prune(p_keep_days integer default 180)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_deleted integer;
begin
  delete from public.site_events where created_at < now() - make_interval(days => greatest(30, p_keep_days));
  get diagnostics v_deleted = row_count;
  return v_deleted;
end;
$$;
