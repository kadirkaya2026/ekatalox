-- Magnetle girenlerin göreceği fiyat listesi (opsiyonel).
--
-- NULL ise magnet ziyaretçisi şifresiz ziyaretçiyle aynı listeyi görür
-- (public_price_list_id, o da yoksa ilk fiyatlı liste). Liste silinirse
-- otomatik NULL'a döner ve akış kendini onarır (magnet-enter fallback'i).
alter table public.tenants
  add column if not exists magnet_price_list_id uuid
    references public.price_lists(id) on delete set null;
