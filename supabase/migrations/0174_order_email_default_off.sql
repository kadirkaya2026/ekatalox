-- Sipariş e-postası varsayılan KAPALI (kullanıcı kararı 14 Eki 2026: gereksiz
-- e-posta maliyeti olmasın, isteyen Ayarlar → E-posta Bildirimleri'nden açar).
-- 0173 aynı gün ~10 dk açık varsayılanla canlıdaydı; herkes kapalıya çekilir.
alter table public.tenants alter column order_email_enabled set default false;
update public.tenants set order_email_enabled = false where order_email_enabled is distinct from false;
