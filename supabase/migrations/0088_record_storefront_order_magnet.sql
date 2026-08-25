-- record_storefront_order'a magnet sahiplenmesi ve telefon engeli ekleniyor.
--
-- NEDEN drop + create: create or replace ile parametre EKLENEMEZ — yeni bir
-- overload oluşur ve mevcut çağrılar "function is not unique" ile belirsizleşir.
-- Önce eski imza düşürülüyor, sonra 12 parametreli hâli yaratılıyor.
--
-- DEPLOY PENCERESİ: p_magnet_code_id DEFAULT NULL olduğu için hâlâ eski kodu
-- çalıştıran Vercel fonksiyonlarının 11 argümanlı çağrıları da bu yeni
-- fonksiyona çözülür. Yani migration'ı deploy'dan önce çalıştırmak güvenli;
-- arada sipariş kaybı olmaz.

drop function if exists public.record_storefront_order(
  uuid, text, text, text, text, text, numeric, text, integer, jsonb, text
);

create function public.record_storefront_order(
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
  v_customer_id uuid;
  v_order_id uuid;
  v_magnet_id uuid;
begin
  -- Telefon engeli: savunma katmanı. Asıl engelleme generate-pdf route'unda
  -- PDF üretilmeden önce 403 ile yapılıyor; burası route atlanırsa diye var.
  if exists (
    select 1 from public.blocked_customer_phones
     where tenant_id = p_tenant_id and phone = p_phone
  ) then
    return null;
  end if;

  -- Magnet kodu YALNIZCA bu tenant'a atanmışsa dikkate alınır. Çerez başka
  -- bayinin koduyla gelirse (kod yeniden atandıysa vb.) sessizce yok sayılır.
  if p_magnet_code_id is not null then
    select id into v_magnet_id
      from public.magnet_codes
     where id = p_magnet_code_id and tenant_id = p_tenant_id;
  end if;

  insert into public.customers (tenant_id, phone, full_name, address, last_order_at, updated_at)
  values (p_tenant_id, p_phone, p_full_name, p_address, now(), now())
  on conflict (tenant_id, phone)
  do update set
    full_name = excluded.full_name,
    address = excluded.address,
    last_order_at = now(),
    updated_at = now()
  returning id into v_customer_id;

  insert into public.orders (
    tenant_id,
    customer_id,
    order_number,
    customer_name,
    customer_phone,
    customer_address,
    currency,
    total_amount,
    payment_method,
    item_count,
    items,
    note,
    magnet_code_id
  )
  values (
    p_tenant_id,
    v_customer_id,
    p_order_number,
    p_full_name,
    p_phone,
    p_address,
    p_currency,
    coalesce(p_total_amount, 0),
    p_payment_method,
    coalesce(p_item_count, 0),
    coalesce(p_items, '[]'::jsonb),
    p_note,
    v_magnet_id
  )
  returning id into v_order_id;

  -- Sessiz sahiplenme: magnetten gelen İLK sipariş magneti bu müşteriye
  -- bağlar. customer_id is null koşulu, eşzamanlı iki "ilk sipariş"te tek
  -- kazanan olmasını garantiler (satır kilidi + koşul). Sonraki siparişler
  -- sahibi DEĞİŞTİRMEZ; bayi panelden elle değiştirebilir/sıfırlayabilir.
  if v_magnet_id is not null then
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

-- PostgREST şema önbelleğini tazele; yoksa yeni imza deploy'a kadar görünmez.
notify pgrst, 'reload schema';
