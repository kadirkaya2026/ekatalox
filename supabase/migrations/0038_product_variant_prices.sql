create table if not exists public.product_variant_prices (
  variant_id uuid not null references public.product_variants(id) on delete cascade,
  price_list_id uuid not null references public.price_lists(id) on delete cascade,
  price numeric(12, 2) not null check (price >= 0),
  primary key (variant_id, price_list_id)
);

create index if not exists product_variant_prices_price_list_id_idx
  on public.product_variant_prices (price_list_id);

alter table public.product_variant_prices enable row level security;

create policy "Tenant admin can manage own product variant prices"
  on public.product_variant_prices
  for all
  using (
    exists (
      select 1
      from public.product_variants pv
      join public.products pr on pr.id = pv.product_id
      join public.tenant_memberships tm on tm.tenant_id = pr.tenant_id
      where pv.id = product_variant_prices.variant_id
        and tm.user_id = auth.uid()
    )
  );

create policy "Super admin can manage all product variant prices"
  on public.product_variant_prices
  for all
  using (
    exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.role = 'super_admin'
    )
  );
