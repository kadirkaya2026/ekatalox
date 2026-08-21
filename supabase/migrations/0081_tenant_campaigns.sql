-- Bayinin kendi tanımladığı kampanyalar.
--
-- İki tür kart aynı tabloda:
--   rule_type = 'none'            -> sadece duyuru kartı ("2 al 1 öde"),
--                                    sepete dokunmaz
--   rule_type = 'cart_threshold'  -> sepet indirimi ("1500 TL al, 100 TL indirim")
--
-- Ayarlardaki eski nakit/kart basamakları (cash_discount_tiers,
-- card_campaign_tiers) olduğu gibi duruyor ve bundan bağımsız çalışıyor.
--
-- Para birimi alanı bilerek yok: sepet zaten tek para birimine kilitli
-- (getCartPaymentSummary, currencies.length !== 1) ve mevcut
-- CashDiscountTier.threshold da düz sayı. Aynı varsayım korunuyor.

create table if not exists public.tenant_campaigns (
  id               uuid primary key default gen_random_uuid(),
  tenant_id        uuid not null references public.tenants(id) on delete cascade,
  title            text not null,
  description      text,
  image_url        text,
  badge_label      text,
  starts_at        timestamptz,
  ends_at          timestamptz,
  is_active        boolean not null default true,
  link_category_id uuid references public.categories(id) on delete set null,
  display_order    integer not null default 0,

  rule_type        text not null default 'none',
  min_cart_amount  numeric(12,2),
  discount_kind    text,
  discount_value   numeric(12,2),
  payment_method   text not null default 'any',

  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),

  constraint tenant_campaigns_rule_type_check
    check (rule_type in ('none', 'cart_threshold')),
  constraint tenant_campaigns_discount_kind_check
    check (discount_kind is null or discount_kind in ('amount', 'percentage')),
  constraint tenant_campaigns_payment_method_check
    check (payment_method in ('any', 'cash', 'card')),
  constraint tenant_campaigns_rule_complete_check
    check (
      rule_type = 'none'
      or (
        min_cart_amount is not null and min_cart_amount > 0
        and discount_kind is not null
        and discount_value is not null and discount_value > 0
        and (discount_kind <> 'percentage' or discount_value <= 100)
      )
    ),
  constraint tenant_campaigns_date_range_check
    check (starts_at is null or ends_at is null or ends_at > starts_at)
);

create index if not exists tenant_campaigns_tenant_active_idx
  on public.tenant_campaigns(tenant_id, is_active);

create index if not exists tenant_campaigns_order_idx
  on public.tenant_campaigns(tenant_id, display_order, created_at);

-- RLS — storefront_sections (0013) ile aynı desen
alter table public.tenant_campaigns enable row level security;

drop policy if exists "Tenant admin can manage own campaigns" on public.tenant_campaigns;
create policy "Tenant admin can manage own campaigns"
  on public.tenant_campaigns
  for all
  using (
    exists (
      select 1 from public.tenant_memberships tm
      join public.profiles p on p.id = tm.user_id
      where tm.tenant_id = tenant_campaigns.tenant_id
        and tm.user_id = auth.uid()
        and p.role = 'tenant_admin'
    )
  );

drop policy if exists "Super admin can manage all campaigns" on public.tenant_campaigns;
create policy "Super admin can manage all campaigns"
  on public.tenant_campaigns
  for all
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'super_admin'
    )
  );

-- Vitrin anonim okuyor (storefront_sections ile aynı).
drop policy if exists "Public can read campaigns" on public.tenant_campaigns;
create policy "Public can read campaigns"
  on public.tenant_campaigns
  for select
  using (true);
