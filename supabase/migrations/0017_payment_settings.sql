-- Kampanyanın hangi ödeme yöntemine uygulanacağı
alter table public.tenant_storefront_settings
  add column if not exists discount_payment_method text not null default 'cash';

alter table public.tenant_storefront_settings
  drop constraint if exists tenant_storefront_settings_discount_payment_method_check;

alter table public.tenant_storefront_settings
  add constraint tenant_storefront_settings_discount_payment_method_check
  check (discount_payment_method in ('cash', 'card'));

-- Kart taksit seçenekleri (JSONB dizi)
alter table public.tenant_storefront_settings
  add column if not exists card_installment_options jsonb not null default '[
    {"count":1,"label":"Peşin","isActive":true,"surchargePercentage":0},
    {"count":2,"label":"2 Taksit","isActive":false,"surchargePercentage":0},
    {"count":3,"label":"3 Taksit","isActive":false,"surchargePercentage":0},
    {"count":4,"label":"4 Taksit","isActive":false,"surchargePercentage":0},
    {"count":6,"label":"6 Taksit","isActive":false,"surchargePercentage":0},
    {"count":9,"label":"9 Taksit","isActive":false,"surchargePercentage":0},
    {"count":12,"label":"12 Taksit","isActive":false,"surchargePercentage":0}
  ]'::jsonb;
