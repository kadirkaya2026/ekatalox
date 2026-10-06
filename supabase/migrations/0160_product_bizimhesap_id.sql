-- BizimHesap ürün eşleştirmesi (6 Eki 2026): BizimHesap'ta stok kodu boş ürünler
-- var (Nailport: 1.781 ürünün 640'ı kodsuz). Ürünün BizimHesap iç kimliği burada;
-- doluysa siparişte productId olarak o gider (BizimHesap kopya ürün açmaz).
alter table public.products
  add column if not exists bizimhesap_product_id text;
