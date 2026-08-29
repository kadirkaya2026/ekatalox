-- Bayi, teslim edildi işaretlenmiş siparişi de iptal edebilsin (sebep zorunlu).
-- Neden: yanlışlıkla "teslim edildi"ye basılan ya da teslim sonrası iade edilen
-- sipariş rapora ciro olarak girmeye devam ediyordu; iptal edilince ciro/kârdan
-- düşer, iptal oranına girer. delivered_at bilgi amaçlı korunur.
create or replace function public.transition_order_status(
  p_tenant_id uuid,
  p_order_id uuid,
  p_to_status text,
  p_reason text default null,
  p_actor text default 'dealer',
  p_actor_profile_id uuid default null
)
returns public.orders
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order public.orders;
  v_from text;
  v_allowed boolean;
begin
  select * into v_order
    from public.orders
   where id = p_order_id and tenant_id = p_tenant_id
   for update;
  if not found then
    raise exception 'order_not_found' using errcode = 'P0002';
  end if;

  v_from := v_order.status;
  v_allowed := case
    when p_to_status = 'cancelled' then v_from in ('new', 'confirmed', 'preparing', 'shipped', 'delivered')
    when p_to_status = 'confirmed' then v_from = 'new'
    when p_to_status = 'preparing' then v_from in ('new', 'confirmed')
    when p_to_status = 'shipped'   then v_from in ('confirmed', 'preparing')
    when p_to_status = 'delivered' then v_from in ('confirmed', 'preparing', 'shipped')
    else false
  end;
  if not v_allowed then
    raise exception 'invalid_transition:%->%', v_from, p_to_status using errcode = 'P0001';
  end if;
  if p_to_status = 'cancelled' and coalesce(trim(p_reason), '') = '' then
    raise exception 'cancel_reason_required' using errcode = 'P0001';
  end if;

  update public.orders
     set status = p_to_status,
         status_updated_at = now(),
         confirmed_at  = case when p_to_status = 'confirmed' then now() else confirmed_at end,
         delivered_at  = case when p_to_status = 'delivered' then now() else delivered_at end,
         cancelled_at  = case when p_to_status = 'cancelled' then now() else cancelled_at end,
         cancel_reason = case when p_to_status = 'cancelled' then left(trim(p_reason), 300) else cancel_reason end
   where id = p_order_id
   returning * into v_order;

  insert into public.order_status_events
    (tenant_id, order_id, from_status, to_status, reason, actor, actor_profile_id)
  values
    (p_tenant_id, p_order_id, v_from, p_to_status, nullif(trim(p_reason), ''), p_actor, p_actor_profile_id);

  return v_order;
end;
$$;
