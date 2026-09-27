-- Kademeli (paket/koli) adet fiyatı (28 Eyl 2026; toptantr.com düzeni, şimdilik
-- demo-gida). Oran = paket/koli alınınca adet fiyatı ÷ normal adet fiyatı;
-- her fiyat listesinin fiyatına aynı oran uygulanır. NULL = kademe yok.
-- Örnek: {"package": 0.9655, "carton": 0.8759}
alter table public.products
  add column if not exists volume_pricing jsonb;
