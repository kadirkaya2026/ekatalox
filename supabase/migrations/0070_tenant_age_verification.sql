-- Market tipi tenant'lar, vitrine giren ziyaretçiden içeriği görmeden önce
-- 18 yaşından büyük olduğunu onaylamasını isteyebilsin (alkol/tütün vb.
-- ürün satan marketler için yasal yaş doğrulama). Ayarlar sayfasından
-- açılıp kapatılabilir, varsayılan kapalı. Yalnızca business_type='market'
-- tenant'larda anlamlı; kontrol app/api/tenant/settings/age-verification
-- route'unda yapılıyor.
alter table public.tenants
  add column if not exists age_verification_required boolean not null default false;
