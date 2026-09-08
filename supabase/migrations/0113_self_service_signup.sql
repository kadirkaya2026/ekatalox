-- 0113: Self-servis kayıt (esnaf paketleri), kayıt kuponları, kayıt kayıtları
-- ve özel şifre sıfırlama token'ları (8 Eyl 2026).
--
-- Yeni tenant'lar artık pazarlama sitesindeki /kayit formundan süper admin
-- olmadan açılıyor (bkz. lib/signup/create-tenant.ts). Kayıtta toplanan
-- işletme/fatura bilgisi tenants satırına yazılır; her deneme ayrıca
-- signup_requests'e loglanır (başarısız olsa bile) ki satış ekibi
-- düşen kayıtları görebilsin. Tüm ifadeler idempotent (if not exists).

-- ---------------------------------------------------------------------------
-- tenants: kayıt formundan gelen alanlar
-- ---------------------------------------------------------------------------
alter table public.tenants
  add column if not exists sector text,
  -- Seçilen ödeme dönemi; fiyat hesabı lib/billing/esnaf-plans.ts'de.
  add column if not exists billing_period text default 'yearly',
  add column if not exists coupon_code text,
  -- Karşılama/ilk sipariş/deneme bitiyor e-postaları bu adrese gider.
  add column if not exists contact_email text,
  add column if not exists contact_full_name text,
  -- {city, district, neighborhood, address, tax_office, tax_number}
  add column if not exists billing_address jsonb,
  -- 'self_service' = /kayit formu; süper admin açılışlarında null kalır.
  add column if not exists signup_source text,
  -- "İlk siparişiniz geldi" e-postası bir kez gönderilir.
  add column if not exists first_order_email_sent_at timestamptz,
  -- Deneme bitimine 5 gün kala hatırlatma e-postası bir kez gönderilir
  -- (bkz. app/api/cron/trial-reminder).
  add column if not exists trial_reminder_sent_at timestamptz;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'tenants_billing_period_check'
  ) then
    alter table public.tenants
      add constraint tenants_billing_period_check
      check (billing_period is null or billing_period in ('monthly', 'yearly'));
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- signup_coupons: kayıt formunda girilen indirim kodları
-- ---------------------------------------------------------------------------
create table if not exists public.signup_coupons (
  id uuid primary key default gen_random_uuid(),
  -- Büyük harf saklanır; arama lower(code) index'iyle harf duyarsız.
  code text not null unique,
  description text,
  discount_type text not null check (discount_type in ('percent', 'amount')),
  discount_value numeric not null check (discount_value > 0),
  -- Plan kimlikleri ('pro', 'business'); null = tüm paketler.
  applies_to_plans text[],
  -- 'monthly' / 'yearly'; null = her iki dönem.
  applies_to_periods text[],
  valid_from timestamptz default now(),
  valid_until timestamptz,
  max_uses integer,
  used_count integer not null default 0,
  is_active boolean not null default true,
  created_by uuid,
  created_at timestamptz default now()
);

create index if not exists signup_coupons_lower_code_idx
  on public.signup_coupons (lower(code));

-- ---------------------------------------------------------------------------
-- signup_requests: her kayıt denemesinin izi (başarılı/başarısız)
-- ---------------------------------------------------------------------------
create table if not exists public.signup_requests (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references public.tenants(id) on delete set null,
  business_name text,
  sector text,
  full_name text,
  phone text,
  email text,
  city text,
  district text,
  neighborhood text,
  address text,
  tax_office text,
  tax_number text,
  subdomain text,
  plan text,
  billing_period text,
  coupon_code text,
  list_price numeric,
  final_price numeric,
  status text default 'created' check (status in ('created', 'failed', 'cancelled')),
  error text,
  ip_address text,
  user_agent text,
  created_at timestamptz default now()
);

create index if not exists signup_requests_created_at_idx
  on public.signup_requests (created_at desc);

-- ---------------------------------------------------------------------------
-- password_reset_tokens: Supabase Auth e-postaları yerine kendi SMTP'mizle
-- gönderilen sıfırlama bağlantıları. Ham token asla saklanmaz, sha256 hash.
-- ---------------------------------------------------------------------------
create table if not exists public.password_reset_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  token_hash text not null unique,
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz default now()
);

create index if not exists password_reset_tokens_user_id_idx
  on public.password_reset_tokens (user_id);

-- ---------------------------------------------------------------------------
-- RPC: kupon kullanımını atomik artır. Aktif, tarih aralığında ve limiti
-- dolmamışsa used_count += 1 ve true; aksi halde false.
-- ---------------------------------------------------------------------------
create or replace function public.redeem_signup_coupon(p_code text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  select id into v_id
    from public.signup_coupons
   where lower(code) = lower(trim(p_code))
     and is_active = true
     and (valid_from is null or valid_from <= now())
     and (valid_until is null or valid_until > now())
     and (max_uses is null or used_count < max_uses)
   for update;

  if v_id is null then
    return false;
  end if;

  update public.signup_coupons
     set used_count = used_count + 1
   where id = v_id;

  return true;
end;
$$;

revoke all on function public.redeem_signup_coupon(text) from public;
grant execute on function public.redeem_signup_coupon(text) to service_role;

-- ---------------------------------------------------------------------------
-- RLS: üç tablo da yalnız service role (sunucu) tarafından okunur/yazılır.
-- Politika tanımlanmadığı için anon/authenticated hiçbir satır göremez.
-- ---------------------------------------------------------------------------
alter table public.signup_coupons enable row level security;
alter table public.signup_requests enable row level security;
alter table public.password_reset_tokens enable row level security;
