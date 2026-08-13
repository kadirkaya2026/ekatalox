-- Stok listesi eşleştirmesinde (bkz. app/api/tenant/products/stock-import)
-- sistemde bulunamayan bir ürünü tenant admin "eklenmesini öner" diyerek
-- süper admine iletebilir. Süper admin onaylayınca ürün hem paylaşılan
-- Master Kataloga (market_catalog_products) hem önerinin sahibi tenant'ın
-- kendi products tablosuna eklenir; tenant'a /dashboard/products sayfasında
-- basit bir bildirim (banner) olarak görünür.

-- Barkod okuyucu kaynaklı öneriler için görsel yok — bu alan artık zorunlu
-- değil (mevcut openfoodfacts kaynaklı satırlar zaten dolu, bozulmuyor).
alter table public.market_catalog_products
  alter column image_url drop not null;

create table if not exists public.product_suggestions (
  id                        uuid primary key default gen_random_uuid(),
  tenant_id                 uuid not null references public.tenants(id) on delete cascade,
  barcode                   text not null,
  product_name              text not null,
  price                     numeric(12, 2),
  status                    text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  category_name             text,
  market_catalog_product_id uuid references public.market_catalog_products(id) on delete set null,
  product_id                uuid references public.products(id) on delete set null,
  reviewed_by               uuid references public.profiles(id) on delete set null,
  reviewed_at               timestamptz,
  dismissed_at              timestamptz,
  created_at                timestamptz not null default now()
);

create index if not exists product_suggestions_tenant_id_idx
  on public.product_suggestions (tenant_id);

create index if not exists product_suggestions_status_idx
  on public.product_suggestions (status);

alter table public.product_suggestions enable row level security;

create policy "tenant admin read own product suggestions"
  on public.product_suggestions
  for select
  using (public.is_tenant_member(tenant_id));

create policy "super admin full access product suggestions"
  on public.product_suggestions
  for all
  using (public.is_super_admin())
  with check (public.is_super_admin());
