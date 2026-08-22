-- Kullanım Şartları kabul kaydı.
--
-- NEDEN AYRI TABLO: /api/register hesap OLUŞTURMUYOR, sadece ekibe e-posta
-- atıyor; tenant hesabı sonradan elle açılıyor. Yani kabul anında bu kaydı
-- bağlayabileceğimiz bir kullanıcı/tenant satırı yok. Kayıt e-posta adresi
-- üzerinden bağımsız tutuluyor, hesap açılınca eşleştirilebiliyor.
--
-- NEDEN KAYIT TUTUYORUZ: TBK m.20-25 (genel işlem koşulları) karşı tarafın
-- bilgilendirilmiş olmasını, içeriği öğrenme imkânı bulmasını ve KABUL
-- ETMESİNİ arıyor. Uyuşmazlıkta ispat yükü bizde; onay kutusunun
-- işaretlendiğini gösteren sunucu tarafı kaydı olmadan ispat zor.
--
-- terms_version: metnin yürürlük tarihi (app/kullanim-sartlari/page.tsx
-- "Son güncelleme" ile aynı). Metin esaslı biçimde değişirse sürüm de
-- değişmeli, aksi halde bayinin hangi metni kabul ettiği belirsiz kalır.

create table if not exists public.terms_acceptances (
  id            uuid primary key default gen_random_uuid(),
  email         text not null,
  full_name     text,
  company       text,
  terms_version text not null,
  accepted_at   timestamptz not null default now(),
  ip_address    text,
  user_agent    text,
  -- Kabulün hangi akıştan geldiği: ileride vitrin/panel gibi başka
  -- noktalarda da onay alınırsa ayrışsın.
  source        text not null default 'kayit_formu',
  created_at    timestamptz not null default now()
);

create index if not exists terms_acceptances_email_idx
  on public.terms_acceptances (lower(email));

create index if not exists terms_acceptances_accepted_at_idx
  on public.terms_acceptances (accepted_at desc);

-- RLS: bu tablo hukuki delil niteliğinde. Politika TANIMLANMADI — RLS
-- açıkken politikasız tablo normal rollere hiçbir satır göstermez.
-- Yalnızca service role (createSupabaseAdminClient) erişebilir. Kasıtlı.
alter table public.terms_acceptances enable row level security;

comment on table public.terms_acceptances is
  'Kullanım Şartları kabul kayıtları — ispat amaçlı. Sadece service role erişir.';
