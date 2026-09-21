-- Kurulum sihirbazı (21 Eyl 2026): bayi "Şimdi değil" deyince ya da sihirbazı
-- bitirince damgalanır; Genel Bakış'ta sihirbaz bir daha kendiliğinden açılmaz
-- (kart üzerinden elle açılabilir). Adım tamamlanma durumu ayrıca saklanmaz,
-- gerçek verilerden (logo, kategori, ürün sayısı vb.) hesaplanır —
-- bkz. lib/onboarding/status.ts.
alter table public.tenants
  add column if not exists onboarding_dismissed_at timestamptz;
