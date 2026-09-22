-- Telefonsuz sipariş kaydı (kullanıcı kararı, 22 Eyl 2026).
--
-- Neden: orders tablosuna yalnız telefon toplanan siparişler yazılıyordu
-- (market tipi sepet formu). Toptancı/genel tenantlarda (ör. Lucatech)
-- telefon alanı yok → müşteri "WhatsApp ile gönder" dediğinde PDF gidiyor ama
-- bayi panelinde (Genel Bakış "Son siparişler" + Siparişler sayfası) hiçbir
-- kayıt oluşmuyordu. Artık her PDF bir sipariş satırı olur: cari adı, tutar,
-- kalemler, tarih. Telefon yoksa müşteri defterine (customers) yazılmaz,
-- engelli-numara kontrolü ve magnet sahiplenme atlanır; magnet kodu yine
-- siparişe işlenir (bayi hangi magnetten geldiğini görür).
--
-- PDF dosyaları değişmez: order_receipts 24 saatte silinmeye devam eder.

alter table public.orders alter column customer_phone drop not null;
alter table public.orders alter column customer_address drop not null;

-- record_storefront_order — AYNI 12 parametreli imza (0093 ile aynı gövde,
-- yalnız telefon boşken müşteri/engel/magnet-sahiplenme adımları atlanır).
create or replace function public.record_storefront_order(
  p_tenant_id uuid,
  p_phone text,
  p_full_name text,
  p_address text,
  p_order_number text,
  p_currency text,
  p_total_amount numeric,
  p_payment_method text,
  p_item_count integer,
  p_items jsonb,
  p_note text default null,
  p_magnet_code_id uuid default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_phone text := nullif(trim(coalesce(p_phone, '')), '');
  v_name text := coalesce(nullif(trim(coalesce(p_full_name, '')), ''), '');
  v_customer_id uuid;
  v_order_id uuid;
  v_magnet_id uuid;
  v_cost_total numeric(12, 2);
  v_cost_missing integer;
  v_order_no integer;
begin
  if v_phone is not null and exists (
    select 1 from public.blocked_customer_phones
     where tenant_id = p_tenant_id and phone = v_phone
  ) then
    return null;
  end if;

  if p_magnet_code_id is not null then
    select id into v_magnet_id
      from public.magnet_codes
     where id = p_magnet_code_id and tenant_id = p_tenant_id;
  end if;

  select
    sum(case when (i->>'unit_cost') is not null
             then (i->>'unit_cost')::numeric * coalesce((i->>'quantity')::numeric, 0) end),
    count(*) filter (where (i->>'unit_cost') is null)
    into v_cost_total, v_cost_missing
  from jsonb_array_elements(coalesce(p_items, '[]'::jsonb)) as i;

  -- Müşteri defteri telefonla anahtarlanır; telefon yoksa müşteri satırı yok.
  if v_phone is not null then
    insert into public.customers (tenant_id, phone, full_name, address, last_order_at, updated_at)
    values (p_tenant_id, v_phone, v_name, coalesce(p_address, ''), now(), now())
    on conflict (tenant_id, phone)
    do update set
      full_name = excluded.full_name,
      address = excluded.address,
      last_order_at = now(),
      updated_at = now()
    returning id into v_customer_id;
  end if;

  v_order_no := public.next_tenant_order_no(p_tenant_id);

  insert into public.orders (
    tenant_id, customer_id, order_number, order_no, customer_name, customer_phone,
    customer_address, currency, total_amount, payment_method, item_count,
    items, note, magnet_code_id, cost_total, cost_missing_count
  )
  values (
    p_tenant_id, v_customer_id, p_order_number, v_order_no, v_name, v_phone,
    nullif(trim(coalesce(p_address, '')), ''), p_currency, coalesce(p_total_amount, 0), p_payment_method,
    coalesce(p_item_count, 0), coalesce(p_items, '[]'::jsonb), p_note,
    v_magnet_id, v_cost_total, coalesce(v_cost_missing, 0)
  )
  returning id into v_order_id;

  insert into public.order_status_events (tenant_id, order_id, from_status, to_status, actor)
  values (p_tenant_id, v_order_id, null, 'new', 'system');

  if v_magnet_id is not null and v_customer_id is not null then
    update public.magnet_codes
       set customer_id = v_customer_id,
           claimed_at = now(),
           first_order_id = v_order_id
     where id = v_magnet_id
       and tenant_id = p_tenant_id
       and customer_id is null;
  end if;

  return v_order_id;
end;
$$;

revoke all on function public.record_storefront_order(
  uuid, text, text, text, text, text, numeric, text, integer, jsonb, text, uuid
) from public;

notify pgrst, 'reload schema';
