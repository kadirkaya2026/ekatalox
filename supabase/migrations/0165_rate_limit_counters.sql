-- Paylaşılan deneme sınırı (8 Eki 2026 güvenlik taraması).
-- lib/api/rate-limit.ts bellek içi Map: her serverless instance'ta ayrı ve soğuk
-- başlatmada sıfırlanıyor; vitrin şifre kodu (4 hane) deneme ile bulunabiliyordu.
-- Sayaç DB'de tutulur, sabit pencere. Yalnız sunucu (service_role) erişir.
create table if not exists public.rate_limit_counters (
  key text primary key,
  window_start timestamptz not null default now(),
  hits integer not null default 0
);

alter table public.rate_limit_counters enable row level security;
revoke all on table public.rate_limit_counters from public, anon, authenticated;

-- Pencere içindeki mevcut sayıyı döndürür (artırmaz).
create or replace function public.rate_limit_peek(p_key text, p_window_seconds integer)
returns integer
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select hits from public.rate_limit_counters
      where key = p_key
        and window_start > now() - make_interval(secs => p_window_seconds)),
    0);
$$;

-- Sayacı bir artırır; pencere dolduysa sıfırdan başlatır. Yeni sayıyı döndürür.
create or replace function public.rate_limit_hit(p_key text, p_window_seconds integer)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_hits integer;
begin
  insert into public.rate_limit_counters as c (key, window_start, hits)
  values (p_key, now(), 1)
  on conflict (key) do update
    set hits = case
          when c.window_start <= now() - make_interval(secs => p_window_seconds) then 1
          else c.hits + 1
        end,
        window_start = case
          when c.window_start <= now() - make_interval(secs => p_window_seconds) then now()
          else c.window_start
        end
  returning hits into v_hits;

  -- Ara sıra eski satırları temizle (tablo şişmesin).
  if random() < 0.01 then
    delete from public.rate_limit_counters where window_start < now() - interval '1 day';
  end if;

  return v_hits;
end;
$$;

revoke execute on function public.rate_limit_peek(text, integer) from public, anon, authenticated;
revoke execute on function public.rate_limit_hit(text, integer) from public, anon, authenticated;
grant execute on function public.rate_limit_peek(text, integer) to service_role;
grant execute on function public.rate_limit_hit(text, integer) to service_role;
