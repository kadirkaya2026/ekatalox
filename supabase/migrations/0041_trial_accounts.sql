-- Deneme hesapları: dolu ise tenant deneme modundadır ve bu tarihte sona erer.
-- Süresi geçtiğinde tenant admin panelde paket seçim popup'ı ile karşılanır.
alter table public.tenants
  add column if not exists trial_ends_at timestamptz;
