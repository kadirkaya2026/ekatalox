-- Şifresiz vitrin (is_password_protected = false) modunda ziyaretçiye hangi
-- fiyat listesinin gösterileceğini tenant admin açıkça seçer; seçilmezse
-- resolveDefaultPriceListForTenant en düşük sort_order'lı FİYATLI (katalog
-- olmayan) listeye düşer — önceden priceLists[0] alınıyordu ve sortPriceLists
-- katalog-only listeyi hep başa koyduğu için şifre kapatılınca ürünler
-- fiyatsız görünüyordu.
alter table public.tenants
  add column if not exists public_price_list_id uuid references public.price_lists(id) on delete set null;
