-- 0136 Alan adı talebi durumları (25 Eyl 2026)
-- Süper adminin seçtiği durum tenant panelinde de görünsün diye ara durum:
-- new (talep alındı) → purchasing (satın alınıyor) → purchased (satın alındı,
-- bağlanıyor) / cancelled (iptal; yalnız süper admin, listeden düşer,
-- tenantta seçim ekranı yeniden açılır).
alter table public.domain_requests drop constraint if exists domain_requests_status_check;
alter table public.domain_requests
  add constraint domain_requests_status_check
  check (status in ('new', 'purchasing', 'purchased', 'cancelled'));
