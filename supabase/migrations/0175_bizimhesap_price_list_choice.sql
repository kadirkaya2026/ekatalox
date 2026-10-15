-- BizimHesap fişi fiyat listesi (Lucatech, 15 Eki 2026): onay penceresinde isteğe bağlı
-- seçilen eKatalox fiyat listesi. Boşsa fişe siparişteki fiyat gider; sipariş kaydı değişmez.
alter table public.orders
  add column if not exists bizimhesap_price_list_id uuid references public.price_lists(id) on delete set null;
