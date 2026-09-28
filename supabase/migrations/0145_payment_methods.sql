-- Ödeme yöntemleri + IBAN + havale kampanyası + online ödeme tercihleri (28 Eyl 2026).
-- Ayarlar → Ödeme ve Kampanyalar → "Ödeme" sekmesi (tüm paketler).
-- Varsayılan: şimdiki davranış (nakit + kart açık).
alter table public.tenant_storefront_settings
  add column if not exists payment_methods jsonb not null
    default '{"cash": true, "transfer": false, "card": true, "online": false}'::jsonb,
  add column if not exists bank_iban text,
  add column if not exists bank_account_holder text,
  add column if not exists bank_name text,
  add column if not exists is_transfer_discount_active boolean not null default false,
  add column if not exists transfer_discount_note text,
  add column if not exists transfer_discount_tiers jsonb not null default '[]'::jsonb,
  -- Sanal POS entegrasyonu (iyzico/PayTR) tamamlanınca kullanılacak tercihler;
  -- gizli anahtarlar BURAYA yazılmaz.
  add column if not exists online_payment_settings jsonb not null default '{}'::jsonb;

-- Siparişte yeni yöntemler (havale; online ileride).
alter table public.orders drop constraint if exists orders_payment_method_check;
alter table public.orders add constraint orders_payment_method_check
  check (payment_method = any (array['cash'::text, 'card'::text, 'transfer'::text, 'online'::text]));
