-- Müşteriye özel kupon: bayi Cari kartından tanımlar, telefon numarasına
-- bağlıdır (kod yok). Sepette numara yazılınca otomatik uygulanır; müşteriye
-- push ile duyurulur; Kampanyalar sayfasında görünür.
create table if not exists public.customer_coupons (
  id               uuid primary key default gen_random_uuid(),
  tenant_id        uuid not null references public.tenants(id) on delete cascade,
  customer_id      uuid not null,
  phone            text not null,                       -- normalize (yalnız rakam)
  kind             text not null check (kind in ('percent', 'amount')),
  value            numeric(12, 2) not null check (value > 0),
  min_order_amount numeric(12, 2) check (min_order_amount is null or min_order_amount >= 0),
  currency         text not null default 'TRY',
  title            text not null,
  message          text,
  expires_at       timestamptz,
  single_use       boolean not null default true,
  status           text not null default 'active' check (status in ('active', 'used', 'cancelled')),
  used_at          timestamptz,
  used_order_id    uuid references public.orders(id) on delete set null,
  created_by       uuid references public.profiles(id) on delete set null,
  created_at       timestamptz not null default now(),
  constraint customer_coupons_customer_fk
    foreign key (tenant_id, customer_id) references public.customers (tenant_id, id) on delete cascade
);
create index if not exists customer_coupons_lookup_idx
  on public.customer_coupons (tenant_id, phone, status);
create index if not exists customer_coupons_customer_idx
  on public.customer_coupons (customer_id, created_at desc);
alter table public.customer_coupons enable row level security;
drop policy if exists "tenant member reads own coupons" on public.customer_coupons;
create policy "tenant member reads own coupons"
  on public.customer_coupons for select using (public.is_tenant_member(tenant_id));

alter table public.orders
  add column if not exists coupon_id uuid references public.customer_coupons(id) on delete set null,
  add column if not exists coupon_discount numeric(12, 2) not null default 0;

-- Sipariş kaydından sonra kuponu tüket (tek kullanımlıksa) ve siparişe işle.
-- Atomik: aynı kupon iki siparişte kullanılamaz.
create or replace function public.redeem_customer_coupon(
  p_tenant_id uuid,
  p_coupon_id uuid,
  p_order_id uuid,
  p_discount numeric
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_single boolean;
  v_ok boolean := false;
begin
  select single_use into v_single
    from public.customer_coupons
   where id = p_coupon_id and tenant_id = p_tenant_id and status = 'active'
     and (expires_at is null or expires_at > now())
   for update;
  if not found then
    return false;
  end if;

  if v_single then
    update public.customer_coupons
       set status = 'used', used_at = now(), used_order_id = p_order_id
     where id = p_coupon_id;
  end if;

  update public.orders
     set coupon_id = p_coupon_id, coupon_discount = coalesce(p_discount, 0)
   where id = p_order_id and tenant_id = p_tenant_id;
  v_ok := true;
  return v_ok;
end;
$$;
revoke all on function public.redeem_customer_coupon(uuid, uuid, uuid, numeric) from public;

notify pgrst, 'reload schema';
