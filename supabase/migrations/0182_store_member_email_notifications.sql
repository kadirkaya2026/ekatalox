-- Üye e-posta bildirimi (17 Eki 2026): telefonda bildirim açık değilse sipariş
-- durumu (onaylandı, hazırlanıyor, yola çıktı…) üyenin e-postasına mağazanın
-- adıyla gider. Varsayılan kapalı; Hesabım > Bildirimler'den açılır.
alter table public.store_members
  add column if not exists email_notifications boolean not null default false;
