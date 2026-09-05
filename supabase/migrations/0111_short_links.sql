-- Sipariş mesajındaki linkleri kısaltmak için kod → hedef eşlemesi
-- (kullanıcı isteği, 5 Eyl 2026). WhatsApp mesajında sipariş fişi ve konum
-- linkleri satır satır taşıyordu; artık bayinin KENDİ alan adında kısa bir
-- adres gönderiliyor: https://<bayi-alan-adi>/f/<kod>
--
-- Kod bilerek bayinin domaininde: müşteri ekatalox.com değil, alışveriş
-- yaptığı dükkânın adresini görüyor.
create table if not exists public.short_links (
  code text primary key,
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  target_url text not null,
  kind text not null default 'order_pdf',
  created_at timestamptz not null default now()
);

create index if not exists short_links_tenant_created_idx
  on public.short_links (tenant_id, created_at desc);

-- Vitrin rotası admin (service role) client ile okur; anon erişim yok.
alter table public.short_links enable row level security;
