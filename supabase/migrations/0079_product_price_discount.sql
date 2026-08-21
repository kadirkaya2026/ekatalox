-- İndirim artık fiyat listesi başına (kullanıcı isteği, 21 Ağu 2026).
--
-- Eskiden tek bir products.discount_price vardı ve TÜM listelere aynı
-- indirimli fiyat uygulanıyordu: 1. listede 75 TL olan ürünü 70 yapınca
-- 2. ve 3. listede de 70 oluyordu. Artık her liste kendi indirimli
-- fiyatını taşıyor; bir listede değer yoksa o listede indirim yok.
alter table public.product_prices
  add column if not exists discount_price numeric(12, 2);

alter table public.product_prices
  drop constraint if exists product_prices_discount_price_check;
alter table public.product_prices
  add constraint product_prices_discount_price_check
    check (discount_price is null or discount_price >= 0);

-- Mevcut davranışı koru: indirimi açık ürünlerde, liste fiyatı indirimli
-- fiyattan yüksek olan HER listeye eski tek değer yazılıyor. Böylece
-- yayına alındığında hiçbir vitrinde fiyat değişmiyor.
update public.product_prices pp
set discount_price = p.discount_price
from public.products p
where pp.product_id = p.id
  and p.is_discount_active
  and p.discount_price is not null
  and pp.price > p.discount_price
  and pp.discount_price is null;

-- İndirim şeridi sorgusu (aktif liste + indirimi olan satırlar) için.
create index if not exists product_prices_discount_idx
  on public.product_prices (price_list_id)
  where discount_price is not null;
