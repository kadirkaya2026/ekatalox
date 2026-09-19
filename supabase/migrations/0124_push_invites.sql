-- "Tek link" bildirim daveti (/bildirim sayfası). iPhone'da Web Push yalnız
-- ana ekrana eklenmiş sitede çalışır ve ana ekran uygulamasının deposu
-- Safari'den ayrıdır; müşterinin Safari'de yazdığı ad/telefon ana ekrandan
-- açınca kaybolur. Bu tablo o bilgiyi sunucuda, kısa ömürlü bir token ile
-- taşır: Safari'de form → token → manifest start_url'e gömülür → ana
-- ekrandan açılınca tek tuşla abonelik (app/store/[subdomain]/bildirim).
create table if not exists public.push_invites (
  id               uuid primary key default gen_random_uuid(),
  token            text not null unique,
  tenant_id        uuid not null references public.tenants(id) on delete cascade,
  access_code_id   uuid references public.access_codes(id) on delete set null,
  price_list_id    uuid references public.price_lists(id) on delete set null,
  subscriber_name  text not null,
  subscriber_phone text not null,
  user_agent       text,
  created_at       timestamptz not null default now(),
  subscribed_at    timestamptz
);

create index if not exists push_invites_tenant_idx on public.push_invites (tenant_id, created_at desc);

alter table public.push_invites enable row level security;
-- Politika yok: yalnız service role (API rotaları) okur/yazar.
