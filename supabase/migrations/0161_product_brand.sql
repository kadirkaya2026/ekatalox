-- Ürün markası (7 Eki 2026, Nailport isteği): isteğe bağlı serbest metin.
-- Vitrinde ürün adının üstünde küçük etiket olarak görünür; Excel'de "Marka" sütunu.
alter table public.products
  add column if not exists brand text;
