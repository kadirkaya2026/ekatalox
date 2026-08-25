-- Magnet CRM: magnetin sahibi, pasife alma, sipariş kaynağı ve ölçeklenebilir
-- okutma sayacı.
--
-- Neden: magnetler bugün sadece "hangi bayiye gidiyor" bilgisini taşıyor.
-- Hedef, magnetten gelen İLK tamamlanan siparişin o magneti sessizce bir
-- müşteriye bağlaması; bayi böylece "bu magnet mahalleden Ahmet abinin"
-- bilgisine sahip oluyor. Müşteriye hiçbir form sorulmuyor.
--
-- DİKKAT: Yeni eklenen sütuna dokunan her ifade DO bloğunun içinde ve
-- EXECUTE ile çalışıyor. Sebebi: Supabase SQL editörü (ve genel olarak
-- basit sorgu protokolü) çok ifadeli betiğin TAMAMINI çalıştırmadan önce
-- parse ediyor; ALTER henüz işlemediği için aşağıdaki UPDATE/CREATE INDEX
-- "column does not exist" hatası veriyor ve tüm işlem geri alınıyor.
-- DO gövdesi bir metin olduğundan çalışma anında derleniyor.
--
-- Bu dosya YALNIZCA şema açar. Hiçbir kod bu sütunları henüz okumuyor;
-- davranış değişikliği sonraki migration ve deploy ile geliyor.

-- ---------------------------------------------------------------------------
-- 1) customers üzerinde bileşik benzersizlik
-- ---------------------------------------------------------------------------
-- magnet_codes.customer_id'nin AYNI tenant'a ait bir müşteriyi göstermesini
-- foreign key ile garantileyebilmek için gerekli. Tek başına (id) primary key
-- yetmiyor; (tenant_id, id) ikilisine referans verebilmek lazım.
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'customers_tenant_id_id_key'
  ) then
    alter table public.customers
      add constraint customers_tenant_id_id_key unique (tenant_id, id);
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- 2) magnet_codes yeni sütunlar
-- ---------------------------------------------------------------------------
alter table public.magnet_codes
  -- Pasif magnet /t/{kod} adresinde vitrine gitmez.
  add column if not exists is_disabled boolean not null default false,
  add column if not exists disabled_at timestamptz,
  -- Kimin kapattığı kaybolmasın: bayi, süper adminin kapattığını geri açabilir
  -- ama kayıtta kimin kapattığı durur.
  add column if not exists disabled_by_role text,
  -- Pasif magnetin yönlendirileceği adres. Kullanıcı kararı google.com
  -- (25 Ağu 2026); sütunda tutuluyor ki fikir değişirse kod değişmeden dönülsün.
  add column if not exists disabled_redirect_url text not null
    default 'https://google.com',
  -- Magneti sahiplenen müşteri. İLK tamamlanan sipariş sessizce sahiplenir;
  -- bayi sonradan başka müşteriye alabilir veya sıfırlayabilir.
  add column if not exists customer_id uuid,
  add column if not exists claimed_at timestamptz,
  -- Bayi panelinde "ilk siparişin adı/telefonu/adresi" buradan okunuyor.
  add column if not exists first_order_id uuid,
  -- DENORMALİZE SAYAÇ. Admin sayfası bugün TÜM magnet_scans satırlarını belleğe
  -- çekip JS'te sayıyor; PostgREST 1000 satırda kestiği için sayılar zaten
  -- yanlış. 10.000 magnette bu tamamen çöker.
  add column if not exists scan_count integer not null default 0,
  add column if not exists last_scan_at timestamptz;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'magnet_codes_disabled_by_role_check'
  ) then
    alter table public.magnet_codes
      add constraint magnet_codes_disabled_by_role_check
      check (disabled_by_role is null or disabled_by_role in ('super_admin', 'tenant_admin'));
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'magnet_codes_first_order_fk'
  ) then
    alter table public.magnet_codes
      add constraint magnet_codes_first_order_fk
      foreign key (first_order_id) references public.orders(id) on delete set null;
  end if;

  -- Müşteri her zaman magnetin atandığı bayinin müşterisi olmalı. Çapraz
  -- tenant sızıntısını uygulama katmanına bırakmıyoruz.
  if not exists (
    select 1 from pg_constraint where conname = 'magnet_codes_customer_same_tenant_fk'
  ) then
    alter table public.magnet_codes
      add constraint magnet_codes_customer_same_tenant_fk
      foreign key (tenant_id, customer_id)
      references public.customers (tenant_id, id) on delete set null;
  end if;
end $$;

create index if not exists magnet_codes_tenant_code_idx
  on public.magnet_codes (tenant_id, lower(code));
create index if not exists magnet_codes_created_at_idx
  on public.magnet_codes (created_at desc);
-- Aralık ataması yalnızca sahipsiz kodlara bakıyor; kısmi indeks tam o sorgu için.
create index if not exists magnet_codes_free_idx
  on public.magnet_codes (created_at) where tenant_id is null;
do $$
begin
  execute 'create index if not exists magnet_codes_customer_idx
             on public.magnet_codes (customer_id)';
end $$;

-- ---------------------------------------------------------------------------
-- 3) magnet_scans -> magnet_codes gerçek foreign key
-- ---------------------------------------------------------------------------
-- Bugün bağ metin üzerinden (slug = kod metni). Kod düzenlenince geçmiş yetim
-- kalıyordu ve API elle slug güncellemek zorundaydı.
alter table public.magnet_scans
  add column if not exists magnet_code_id uuid;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'magnet_scans_code_fk'
  ) then
    alter table public.magnet_scans
      add constraint magnet_scans_code_fk
      foreign key (magnet_code_id) references public.magnet_codes(id) on delete cascade;
  end if;
end $$;

do $$
begin
  execute '
    update public.magnet_scans s
       set magnet_code_id = c.id
      from public.magnet_codes c
     where s.magnet_code_id is null
       and lower(s.slug) = lower(c.code)';

  execute 'create index if not exists magnet_scans_code_idx
             on public.magnet_scans (magnet_code_id, scanned_at desc)';
end $$;

-- ---------------------------------------------------------------------------
-- 4) Okutma sayacı: geri doldurma + trigger
-- ---------------------------------------------------------------------------
do $$
begin
  execute '
    update public.magnet_codes c
       set scan_count = x.adet,
           last_scan_at = x.son
      from (
        select magnet_code_id, count(*) as adet, max(scanned_at) as son
          from public.magnet_scans
         where magnet_code_id is not null
         group by magnet_code_id
      ) x
     where c.id = x.magnet_code_id';
end $$;

create or replace function public.bump_magnet_scan_count()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.magnet_code_id is not null then
    update public.magnet_codes
       set scan_count = scan_count + 1,
           last_scan_at = new.scanned_at
     where id = new.magnet_code_id;
  end if;
  return new;
end;
$$;

drop trigger if exists magnet_scans_bump_count on public.magnet_scans;
create trigger magnet_scans_bump_count
  after insert on public.magnet_scans
  for each row execute function public.bump_magnet_scan_count();

-- ---------------------------------------------------------------------------
-- 5) Sipariş kaynağı
-- ---------------------------------------------------------------------------
-- Yalnızca sahiplenen ilk sipariş değil, o magnetin çerezini taşıyan HER
-- sipariş işaretlenir; bayi "bu magnetten kaç sipariş geldi" görebilsin.
alter table public.orders
  add column if not exists magnet_code_id uuid;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'orders_magnet_code_fk'
  ) then
    alter table public.orders
      add constraint orders_magnet_code_fk
      foreign key (magnet_code_id) references public.magnet_codes(id) on delete set null;
  end if;
end $$;

do $$
begin
  execute 'create index if not exists orders_magnet_code_idx
             on public.orders (magnet_code_id, created_at desc)';
end $$;

-- ---------------------------------------------------------------------------
-- 6) Telefon bazlı müşteri engelleme
-- ---------------------------------------------------------------------------
-- Bayi bir numarayı engellerse o numaradan sipariş geçmez. Magneti pasife almak
-- müşteriyi engellemez (kişi siteye doğrudan da girebilir) — asıl engel bu.
create table if not exists public.blocked_customer_phones (
  id         uuid primary key default gen_random_uuid(),
  tenant_id  uuid not null references public.tenants(id) on delete cascade,
  -- normalizeCustomerPhone() ile aynı biçim: yalnızca rakamlar.
  -- bkz. lib/storefront/customer-phone.ts
  phone      text not null,
  reason     text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (tenant_id, phone)
);

alter table public.blocked_customer_phones enable row level security;

drop policy if exists "tenant member reads own blocked phones" on public.blocked_customer_phones;
create policy "tenant member reads own blocked phones"
  on public.blocked_customer_phones for select
  using (public.is_tenant_member(tenant_id));

drop policy if exists "super admin reads blocked phones" on public.blocked_customer_phones;
create policy "super admin reads blocked phones"
  on public.blocked_customer_phones for select
  using (public.is_super_admin());
