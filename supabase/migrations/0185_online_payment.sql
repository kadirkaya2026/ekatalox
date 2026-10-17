-- Online ödeme 2. aşama (17 Eki 2026): A modeli — her mağaza kendi iyzico /
-- PayTR / Paynet üye işyeri hesabıyla tahsil eder, para doğrudan ona gider.
-- Anahtarlar GİZLİ: ayrı tabloda, AES-256-GCM ile şifreli (lib/payments/
-- credentials.ts, PAYMENT_CREDENTIALS_KEY); RLS açık ve politika yok → yalnız
-- service role okur, tarayıcıya hiç gitmez.
create table if not exists public.tenant_payment_providers (
  tenant_id uuid primary key references public.tenants(id) on delete cascade,
  provider text not null check (provider in ('iyzico', 'paytr', 'paynet')),
  is_test boolean not null default false,
  credentials_enc text not null,
  -- Panelde "…a1b2" gibi gösterilen kısa ipucu (anahtarın kendisi değil).
  key_hint text,
  verified_at timestamptz,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.tenant_payment_providers enable row level security;

-- Siparişin ödeme durumu: yalnız online ödemeli siparişlerde dolu.
alter table public.orders
  add column if not exists payment_status text
    check (payment_status in ('awaiting', 'paid', 'failed')),
  add column if not exists payment_provider text,
  add column if not exists paid_amount numeric(12, 2),
  add column if not exists paid_at timestamptz,
  add column if not exists legal_consent_at timestamptz;

-- Her "Öde" denemesi ayrı satır: müşteri yeniden denerse eski denemenin geç
-- gelen bildirimi de doğru siparişe işlenir. reference = sağlayıcıya giden
-- sipariş kimliği (PayTR merchant_oid, iyzico basketId, Paynet reference_no).
create table if not exists public.order_payment_attempts (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  order_id uuid not null references public.orders(id) on delete cascade,
  provider text not null check (provider in ('iyzico', 'paytr', 'paynet')),
  reference text not null unique,
  provider_token text,
  amount numeric(12, 2) not null,
  status text not null default 'pending' check (status in ('pending', 'paid', 'failed')),
  error text,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);
create index if not exists order_payment_attempts_order_idx
  on public.order_payment_attempts (order_id, created_at desc);
alter table public.order_payment_attempts enable row level security;

-- Panelde "ödeme bekleniyor / ödendi" süzgeci için.
create index if not exists orders_tenant_payment_status_idx
  on public.orders (tenant_id, payment_status)
  where payment_status is not null;
