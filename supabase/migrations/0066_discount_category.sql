-- Bir kategori "indirim kategorisi" olarak işaretlenebilsin: bu kategoriye
-- tıklandığında, o kategoriye elle atanmış ürünler yerine, mağazadaki
-- gerçekten indirimde olan (discount_percentage > 0) TÜM ürünler otomatik
-- listelenir — bkz. components/storefront/storefront-client.tsx filteredProducts.
alter table public.categories
  add column if not exists is_discount_category boolean not null default false;
