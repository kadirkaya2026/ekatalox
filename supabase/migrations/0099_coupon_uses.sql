-- Kupon kullanım hakkı: bayi 1/2/3… kez seçer. Her siparişte used_count artar;
-- hakkı dolunca status='used' → vitrin/lookup görmez, Kampanyalar'dan kalkar.
alter table public.customer_coupons
  add column if not exists max_uses integer not null default 1 check (max_uses >= 1),
  add column if not exists used_count integer not null default 0;

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
  v_max integer;
  v_used integer;
begin
  select max_uses, used_count into v_max, v_used
    from public.customer_coupons
   where id = p_coupon_id and tenant_id = p_tenant_id and status = 'active'
     and (expires_at is null or expires_at > now())
   for update;
  if not found then
    return false;
  end if;

  update public.customer_coupons
     set used_count = v_used + 1,
         used_at = now(),
         used_order_id = p_order_id,
         status = case when v_used + 1 >= v_max then 'used' else status end
   where id = p_coupon_id;

  update public.orders
     set coupon_id = p_coupon_id, coupon_discount = coalesce(p_discount, 0)
   where id = p_order_id and tenant_id = p_tenant_id;
  return true;
end;
$$;
revoke all on function public.redeem_customer_coupon(uuid, uuid, uuid, numeric) from public;
notify pgrst, 'reload schema';
