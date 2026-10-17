-- Tahsilat kaydı (17 Eki 2026, kullanıcı isteği): toptancı siparişi onaylarken
-- ödemeyi aldıysa yöntemini (nakit / kart / online) ve tutarını girer; raporlama
-- için. payment_method = müşterinin sepette seçtiği, paid_method = fiilen
-- tahsil edilen. Online ödeme sağlayıcıdan onaylanınca paid_method='online'.
alter table public.orders
  add column if not exists paid_method text
    check (paid_method in ('cash', 'card', 'online', 'transfer'));
update public.orders set paid_method = 'online' where payment_status = 'paid' and paid_method is null;
