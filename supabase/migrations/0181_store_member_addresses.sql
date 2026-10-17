-- Üye adresleri (17 Eki 2026, Getir mantığı): başlıklı (Ev, İşyeri…) birden çok
-- adres, biri ana adres. Üyenin ilk siparişindeki adres, kayıtlı adresi yoksa
-- ana adres olarak kaydedilir (generate-pdf). Sepette üye adres seçer.
create table if not exists public.store_member_addresses (
  id          uuid primary key default gen_random_uuid(),
  member_id   uuid not null references public.store_members(id) on delete cascade,
  tenant_id   uuid not null references public.tenants(id) on delete cascade,
  title       text not null default 'Ev',
  address     text not null,
  is_default  boolean not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists store_member_addresses_member_idx
  on public.store_member_addresses (member_id, created_at);

alter table public.store_member_addresses enable row level security;

drop policy if exists "tenant admin read own member addresses" on public.store_member_addresses;
create policy "tenant admin read own member addresses"
  on public.store_member_addresses for select
  using (public.is_tenant_member(tenant_id));

-- Kayıtta yazılan adres ana adres olur.
insert into public.store_member_addresses (member_id, tenant_id, title, address, is_default)
select m.id, m.tenant_id, 'Ev', m.address, true
  from public.store_members m
 where coalesce(trim(m.address), '') <> ''
   and not exists (select 1 from public.store_member_addresses a where a.member_id = m.id);
