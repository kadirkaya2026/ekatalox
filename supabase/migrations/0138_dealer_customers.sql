-- Bayi müşterileri (27 Eyl 2026, yalnız Kurumsal paket): bayi başvurusu
-- onaylanınca başvurana KİŞİYE ÖZEL şifre verilir. Şifre yine bir fiyat
-- listesine bağlı access_codes satırıdır (unique(tenant_id, password_code)
-- sayesinde başka müşteriye/ortak şifreye verilemez); üstüne müşteri
-- bilgileri taşınır. Bu şifreyle girenin sipariş fişine ad/telefon/adres
-- otomatik yazılır. Ortak liste şifreleri (is_personal=false) aynen çalışır.

alter table public.access_codes
  add column if not exists is_personal boolean not null default false,
  add column if not exists customer_company text,
  add column if not exists customer_name text,
  add column if not exists customer_phone text,
  add column if not exists customer_address text,
  add column if not exists customer_city text,
  add column if not exists customer_note text,
  add column if not exists dealer_application_id uuid
    references public.dealer_applications(id) on delete set null;

create index if not exists access_codes_tenant_personal_idx
  on public.access_codes (tenant_id) where is_personal;

-- Başvuru formuna adres; onaylanan başvurunun verilen şifresi.
alter table public.dealer_applications
  add column if not exists address text,
  add column if not exists access_code_id uuid
    references public.access_codes(id) on delete set null;

-- Siparişin hangi şifreyle verildiği (müşteri sayfasında sipariş sayısı).
alter table public.orders
  add column if not exists access_code_id uuid
    references public.access_codes(id) on delete set null;

create index if not exists orders_access_code_idx
  on public.orders (access_code_id) where access_code_id is not null;
