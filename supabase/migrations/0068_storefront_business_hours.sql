-- Mağaza açılış/kapanış saatleri: tenant admin ya "7/24 açık" seçer, ya da
-- her gün için ayrı ayrı açık/kapalı + saat aralığı belirler. Kapalıyken
-- vitrin "mağazamız şu anda kapalıdır" bildirimi gösterir (bkz.
-- lib/storefront/business-hours.ts, app/store/[subdomain]/page.tsx).
alter table public.tenant_storefront_settings
  add column if not exists is_always_open boolean not null default true;

alter table public.tenant_storefront_settings
  add column if not exists business_hours jsonb not null default '{
    "mon": {"is_open": true, "open_time": "09:00", "close_time": "22:00"},
    "tue": {"is_open": true, "open_time": "09:00", "close_time": "22:00"},
    "wed": {"is_open": true, "open_time": "09:00", "close_time": "22:00"},
    "thu": {"is_open": true, "open_time": "09:00", "close_time": "22:00"},
    "fri": {"is_open": true, "open_time": "09:00", "close_time": "22:00"},
    "sat": {"is_open": true, "open_time": "09:00", "close_time": "22:00"},
    "sun": {"is_open": true, "open_time": "09:00", "close_time": "22:00"}
  }'::jsonb;
