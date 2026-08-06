-- Ürünlere ana fotoğrafa ek olarak 2 fotoğraf daha eklenebilmesi için
-- (toplam 3 fotoğrafa kadar) iki nullable kolon eklendi.
alter table public.products
  add column if not exists image_url_2 text,
  add column if not exists image_url_3 text;
