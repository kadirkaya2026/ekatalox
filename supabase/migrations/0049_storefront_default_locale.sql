-- Tenant'ın vitrininde ilk kez gelen (cookie'si olmayan) ziyaretçiye
-- gösterilecek varsayılan dil. Ziyaretçi header'daki dil seçiciyle bunu
-- kendi tarayıcısında değiştirebilir (bkz. lib/storefront/locale-context.tsx);
-- burası sadece tenant'ın "kimseye dokunulmadıysa hangi dilde açılsın" tercihi.
alter table public.tenant_storefront_settings
  add column if not exists default_locale text not null default 'tr'
    check (default_locale in ('tr', 'de', 'en', 'ru'));
