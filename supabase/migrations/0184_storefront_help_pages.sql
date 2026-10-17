-- Market vitrini "Yardım" sayfaları (17 Eki 2026, Getir örneği): sayfa altı
-- (iletişim/sosyal medya) market mağazalarında kalktı; bilgiler Hesabım >
-- Yardım'da. Mağaza Ayarlar > Yardım Sayfaları'ndan düzenler:
-- { about: text, faq: [{q, a}], support_note: text }
alter table public.tenant_storefront_settings
  add column if not exists help_pages jsonb not null default '{}'::jsonb;
