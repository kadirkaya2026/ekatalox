-- "N al Y hediye" kampanya tipi — yalnız market/tekel tenantlarda sunulur
-- (uygulama seviyesinde kısıtlanır, bkz. tenant-campaigns-form.tsx).
-- Kullanıcı isteği, 4 Eyl 2026: müşteri belirlenen üründen eşik adet
-- alınca, belirlenen hediye ürün(ler)i bedelsiz sepete eklensin; müşteri
-- eşiğin katını alırsa hediye sayısı da katlanabilsin (bayi seçimine bağlı
-- — gift_scales_with_multiples).
alter table public.tenant_campaigns
  add column if not exists gift_trigger_product_id uuid references public.products(id) on delete cascade,
  add column if not exists gift_trigger_quantity integer,
  add column if not exists gift_product_ids uuid[],
  add column if not exists gift_quantity_per_product integer not null default 1,
  add column if not exists gift_scales_with_multiples boolean not null default false;

alter table public.tenant_campaigns
  drop constraint if exists tenant_campaigns_rule_type_check;
alter table public.tenant_campaigns
  add constraint tenant_campaigns_rule_type_check
    check (rule_type in ('none', 'cart_threshold', 'buy_x_get_y'));

alter table public.tenant_campaigns
  drop constraint if exists tenant_campaigns_rule_complete_check;
alter table public.tenant_campaigns
  add constraint tenant_campaigns_rule_complete_check
    check (
      rule_type = 'none'
      or (
        rule_type = 'cart_threshold'
        and min_cart_amount is not null and min_cart_amount > 0
        and discount_kind is not null
        and discount_value is not null and discount_value > 0
        and (discount_kind <> 'percentage' or discount_value <= 100)
      )
      or (
        rule_type = 'buy_x_get_y'
        and gift_trigger_product_id is not null
        and gift_trigger_quantity is not null and gift_trigger_quantity > 0
        and gift_product_ids is not null and array_length(gift_product_ids, 1) > 0
        and gift_quantity_per_product > 0
      )
    );

notify pgrst, 'reload schema';
