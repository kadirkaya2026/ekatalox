-- Online ödeme (0185 devamı, 17 Eki 2026): fiş sipariş anında "ödeme bekleniyor"
-- olarak üretilir; ödeme onaylanınca aynı bilgilerle "ÖDENDİ" fişi yeniden
-- üretilsin diye fişin girdileri burada saklanır (lib/payments/paid-receipt.ts).
-- Yalnız online ödemeli siparişlerde dolu; fiş yenilenince boşaltılır.
alter table public.orders add column if not exists receipt_payload jsonb;
