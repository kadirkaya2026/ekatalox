-- Önceden basılan QR magnetleri için kod havuzu.
--
-- SORUN: /t/{slug} şimdiye kadar slug'ı doğrudan tenant subdomain'i sayıyordu.
-- Bu yüzden magnet ancak bayi belli olduktan SONRA bastırılabiliyordu. Saha
-- satışında tam tersi lazım: magnetler önceden basılıp çantada taşınsın,
-- anlaşma yapılınca kod o bayiye atansın.
--
-- ÇÖZÜM: araya eşleştirme katmanı. Kod (k7m2xq) sabit kalır, tenant_id
-- sonradan doldurulur ve gerekirse DEĞİŞTİRİLİR — bayi çıkarsa aynı magnet
-- başka bayiye devredilebilir. Yönlendirme zaten 302 + no-store olduğu için
-- hedef değişikliği anında yansır (bkz. app/t/[slug]/route.ts).
--
-- Kodlar rastgele: sıralı olsaydı /t/magaza2 yazan biri başka bir bayinin
-- vitrinine düşerdi.

create table if not exists public.magnet_codes (
  id          uuid primary key default gen_random_uuid(),
  code        text not null,
  -- Atanana kadar NULL. Atanmamış kod okutulduğunda "yakında" sayfası çıkar.
  tenant_id   uuid references public.tenants(id) on delete set null,
  -- Matbaa partisi / bölge notu: "Bağcılar 1. parti" gibi.
  label       text,
  assigned_at timestamptz,
  created_at  timestamptz not null default now()
);

-- Kod büyük/küçük harf duyarsız benzersiz olmalı: magnetteki metni elle
-- yazan müşteri K7M2XQ da yazabilir.
create unique index if not exists magnet_codes_code_unique
  on public.magnet_codes (lower(code));

create index if not exists magnet_codes_tenant_idx
  on public.magnet_codes (tenant_id);

-- RLS: kod havuzunu yalnızca süper admin yönetir. Yönlendirme rotası
-- service role ile okuduğu için politika gerekmiyor; politikasız RLS
-- normal rollere hiçbir satır göstermez.
alter table public.magnet_codes enable row level security;

-- magnet_scans canlı veritabanında elle oluşturulmuş ama hiçbir migration
-- dosyasında yoktu; sıfırdan kurulan ortamda tablo olmadığı için okutma
-- sayacı sessizce çalışmıyordu (rota hatayı yutuyor). Migration'a bağlandı.
create table if not exists public.magnet_scans (
  id         uuid primary key default gen_random_uuid(),
  tenant_id  uuid references public.tenants(id) on delete cascade,
  slug       text not null,
  user_agent text,
  referer    text,
  scanned_at timestamptz not null default now()
);

-- Atanmamış kod okutulduğunda tenant_id yok ama okutmayı yine de saymak
-- istiyoruz: magnet yapıştırıldı mı, kaç kişi denedi?
alter table public.magnet_scans
  alter column tenant_id drop not null;

create index if not exists magnet_scans_tenant_idx
  on public.magnet_scans (tenant_id, scanned_at desc);

create index if not exists magnet_scans_slug_idx
  on public.magnet_scans (lower(slug), scanned_at desc);

alter table public.magnet_scans enable row level security;
