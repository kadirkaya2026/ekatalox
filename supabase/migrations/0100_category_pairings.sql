-- "Yanında iyi gider": kategori → tamamlayıcı kategori eşlemesi (çapraz satış).
-- Kaynak kategorideki ürün sepete/ekrana gelince hedef kategorilerden ürün
-- önerilir; priority küçük olan önce. Alt kategoriler uygulama katmanında
-- genişletilir. NOT: Tütün ürünlerinin önerilmesi 4207 sayılı kanun gereği
-- reklam/özendirme sayılabilir; kullanıcı (2 Eyl 2026) uyarıya rağmen sigara
-- hedefinin eklenmesini istedi — sorumluluk bayide.
create table if not exists public.category_pairings (
  id                 uuid primary key default gen_random_uuid(),
  tenant_id          uuid not null references public.tenants(id) on delete cascade,
  source_category_id uuid not null references public.categories(id) on delete cascade,
  target_category_id uuid not null references public.categories(id) on delete cascade,
  priority           integer not null default 100,
  created_at         timestamptz not null default now(),
  unique (tenant_id, source_category_id, target_category_id)
);
create index if not exists category_pairings_tenant_source_idx
  on public.category_pairings (tenant_id, source_category_id, priority);
alter table public.category_pairings enable row level security;
drop policy if exists "tenant member reads own pairings" on public.category_pairings;
create policy "tenant member reads own pairings"
  on public.category_pairings for select using (public.is_tenant_member(tenant_id));
notify pgrst, 'reload schema';
