-- Ücretli planlarda her yeni siparişte toptancıya e-posta (14 Eki 2026).
-- Adres: tenants.contact_email (kayıtta verilen; panelden değiştirilebilir).
-- Varsayılan açık; Ayarlar → E-posta Bildirimleri'nden kapatılır.
alter table public.tenants
  add column if not exists order_email_enabled boolean not null default true;
