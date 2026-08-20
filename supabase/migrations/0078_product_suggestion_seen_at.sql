-- Bildirim zilinde "görüldü" ile "kapatıldı" artık iki ayrı durum
-- (kullanıcı isteği, 21 Ağu 2026):
--
--   seen_at      : zile tıklayıp listeyi sonuna kadar kaydırınca dolar.
--                  Menüdeki kırmızı sayaç bunu sayar -> sayaç sıfırlanır,
--                  ama bildirimler zilde durmaya devam eder.
--   dismissed_at : bildirime tıklayınca (o satır) veya "Tümünü temizle"
--                  ile (hepsi) dolar. Bildirim listeden kalkar.
--
-- Eskiden tek alan (dismissed_at) vardı; sayacı sıfırlamak bildirimi de
-- yok ediyordu.
alter table public.product_suggestions
  add column if not exists seen_at timestamptz;

-- Sayaç sorgusu (status + seen_at) her dashboard sayfasında layout'ta
-- çalışıyor, bkz. getTenantSuggestionNoticeCount.
create index if not exists product_suggestions_tenant_seen_idx
  on public.product_suggestions (tenant_id, status, seen_at);
