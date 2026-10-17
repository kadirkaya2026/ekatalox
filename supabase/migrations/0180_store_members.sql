-- Market/tekel vitrin üyeliği (17 Eki 2026).
-- Eskiden müşteri yalnız telefon numarasını yazarak siparişlerini görüyordu;
-- başkasının numarasını yazan da görebiliyor, takip linkiyle iptal edebiliyordu.
-- Artık iki yol var: üye (telefon + şifre) ya da üyeliksiz (takip yalnız
-- siparişin linkiyle / o cihazdan). customers tablosu bayinin müşteri defteri
-- olarak aynen kalır; üyelik ayrı tablo, çünkü customers her siparişte
-- yazılan numarayla güncellenir (sahipliği kanıtlanmış değildir).

create table if not exists public.store_members (
  id             uuid primary key default gen_random_uuid(),
  tenant_id      uuid not null references public.tenants(id) on delete cascade,
  phone          text not null,           -- normalizeCustomerPhone biçimi (05xxxxxxxxx)
  password_hash  text not null,           -- scrypt "salt:hash"
  full_name      text not null default '',
  address        text not null default '',
  email          text,
  last_login_at  timestamptz,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  unique (tenant_id, phone)
);

create unique index if not exists store_members_tenant_email_key
  on public.store_members (tenant_id, lower(email)) where email is not null;

alter table public.store_members enable row level security;

drop policy if exists "tenant admin read own store members" on public.store_members;
create policy "tenant admin read own store members"
  on public.store_members for select
  using (public.is_tenant_member(tenant_id));

-- E-postayla şifre sıfırlama: bağlantıdaki token'ın yalnız sha256'sı saklanır.
create table if not exists public.store_member_password_resets (
  id          uuid primary key default gen_random_uuid(),
  member_id   uuid not null references public.store_members(id) on delete cascade,
  token_hash  text not null unique,
  expires_at  timestamptz not null,
  used_at     timestamptz,
  created_at  timestamptz not null default now()
);

create index if not exists store_member_password_resets_member_idx
  on public.store_member_password_resets (member_id);

alter table public.store_member_password_resets enable row level security;

alter table public.orders
  add column if not exists member_id uuid references public.store_members(id) on delete set null;

create index if not exists orders_member_id_created_at_idx
  on public.orders (member_id, created_at desc) where member_id is not null;
