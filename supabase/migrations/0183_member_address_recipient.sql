-- Adreste teslim alacak kişi (17 Eki 2026): müşteri başka birine (ör. annesinin
-- evine) gönderebilsin. Boşsa siparişe üyenin kendi adı/telefonu yazılır.
alter table public.store_member_addresses
  add column if not exists recipient_name text,
  add column if not exists recipient_phone text;
