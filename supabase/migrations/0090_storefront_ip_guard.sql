-- Sipariş ucunda IP taşkın freni + bayi yönetimli IP engelleri.
--
-- Neden DB tabanlı: Vercel'de her istek farklı instance'a düşebilir; bellek içi
-- sayaç instance başına sıfırlanır ve limit fiilen çalışmaz. Sayaç ve engel
-- listesi bu yüzden tabloda.
--
-- Kurgu: generate-pdf'e gelen HER deneme storefront_order_ip_events'e yazılır.
-- Aynı tenant+IP son 10 dakikada 5 denemeyi aşarsa storefront_ip_blocks'a
-- 1 saatlik otomatik engel düşer. Bayi panelden engeli kaldırabilir, süresiz
-- yapabilir ya da uzatabilir (blocked_until null = süresiz).

create table if not exists public.storefront_order_ip_events (
  id         uuid primary key default gen_random_uuid(),
  tenant_id  uuid not null references public.tenants(id) on delete cascade,
  ip         text not null,
  created_at timestamptz not null default now()
);

create index if not exists storefront_order_ip_events_lookup_idx
  on public.storefront_order_ip_events (tenant_id, ip, created_at desc);

create table if not exists public.storefront_ip_blocks (
  id            uuid primary key default gen_random_uuid(),
  tenant_id     uuid not null references public.tenants(id) on delete cascade,
  ip            text not null,
  -- 'auto' = taşkın freni düşürdü, 'manual' = bayi elle koydu/değiştirdi.
  reason        text not null default 'auto'
                check (reason in ('auto', 'manual')),
  -- null = süresiz engel.
  blocked_until timestamptz,
  note          text,
  created_by    uuid references public.profiles(id) on delete set null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (tenant_id, ip)
);

create index if not exists storefront_ip_blocks_tenant_idx
  on public.storefront_ip_blocks (tenant_id, created_at desc);

alter table public.storefront_order_ip_events enable row level security;
alter table public.storefront_ip_blocks enable row level security;

-- Olay tablosunu kimse dışarıdan okumaz; yalnızca service role yazar/okur.
-- Engelleri bayi kendi panelinde görür.
drop policy if exists "tenant member reads own ip blocks" on public.storefront_ip_blocks;
create policy "tenant member reads own ip blocks"
  on public.storefront_ip_blocks for select
  using (public.is_tenant_member(tenant_id));

drop policy if exists "super admin reads ip blocks" on public.storefront_ip_blocks;
create policy "super admin reads ip blocks"
  on public.storefront_ip_blocks for select
  using (public.is_super_admin());
